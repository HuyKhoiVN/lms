using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using lms.Application.DTOs.Common;
using lms.Application.DTOs.LearningMaterials;
using lms.Application.Interfaces.Repositories;
using lms.Application.Interfaces.Services;
using lms.Domain.Entities;

namespace lms.Application.Services;

public sealed class LearningMaterialService : ILearningMaterialService
{
    private static readonly HashSet<string> ImageExtensions = new(StringComparer.OrdinalIgnoreCase) { ".jpg", ".jpeg", ".png", ".webp" };
    private static readonly HashSet<string> VideoExtensions = new(StringComparer.OrdinalIgnoreCase) { ".mp4", ".webm" };
    private static readonly HashSet<string> PdfExtensions = new(StringComparer.OrdinalIgnoreCase) { ".pdf" };
    private static readonly HashSet<string> FileExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".zip", ".txt", ".pdf"
    };

    private readonly ILearningMaterialRepository _materialRepo;
    private readonly ILearningMaterialFileRepository _fileRepo;
    private readonly ILearningMaterialBlockRepository? _blockRepo;
    private readonly ICourseRepository _courseRepo;
    private readonly IMaterialAccessService _accessService;
    private readonly IAuditLogService _auditLog;
    private readonly IFileStorageService? _fileStorage;
    private readonly IConfiguration? _configuration;

    public LearningMaterialService(
        ILearningMaterialRepository materialRepo,
        ILearningMaterialFileRepository fileRepo,
        ICourseRepository courseRepo,
        IMaterialAccessService accessService,
        IAuditLogService auditLog,
        ILearningMaterialBlockRepository? blockRepo = null,
        IFileStorageService? fileStorage = null,
        IConfiguration? configuration = null)
    {
        _materialRepo = materialRepo;
        _fileRepo = fileRepo;
        _courseRepo = courseRepo;
        _accessService = accessService;
        _auditLog = auditLog;
        _blockRepo = blockRepo;
        _fileStorage = fileStorage;
        _configuration = configuration;
    }

    public async Task<ApiResponse<LearningMaterialDetailResponse>> GetByIdAsync(int id)
    {
        var material = await _materialRepo.GetByIdAsync(id);
        if (material is null)
            return ApiResponse<LearningMaterialDetailResponse>.FailureResult("Khong tim thay hoc lieu.");

        return ApiResponse<LearningMaterialDetailResponse>.SuccessResult(await BuildDetailAsync(material));
    }

    public async Task<ApiResponse<PagedResult<LearningMaterialListItemResponse>>> GetPagedAsync(
        LearningMaterialFilterRequest filter, int? studentUserId)
    {
        var page = filter.Page < 1 ? 1 : filter.Page;
        var pageSize = filter.PageSize is < 1 or > 100 ? 20 : filter.PageSize;

        var materials = await _materialRepo.GetPagedAsync(
            filter.CourseId, filter.Keyword, filter.ContentType, page, pageSize);
        var total = await _materialRepo.GetCountAsync(
            filter.CourseId, filter.Keyword, filter.ContentType);

        if (studentUserId.HasValue)
        {
            var accessible = new List<LearningMaterial>();
            foreach (var material in materials)
            {
                if (await _accessService.HasAccessAsync(studentUserId.Value, material.Id))
                    accessible.Add(material);
            }
            materials = accessible;
        }

        var items = new List<LearningMaterialListItemResponse>();
        foreach (var material in materials)
        {
            var blocks = _blockRepo != null
                ? await _blockRepo.GetByMaterialIdAsync(material.Id)
                : new List<LearningMaterialBlock>();
            var fileBackedBlock = blocks.FirstOrDefault(IsFileBackedBlock);
            var legacyFile = (await _fileRepo.GetByMaterialIdAsync(material.Id)).FirstOrDefault();
            items.Add(new LearningMaterialListItemResponse
            {
                Id = material.Id,
                CourseId = material.CourseId,
                Title = material.Title,
                ContentType = material.ContentType,
                Order = material.Order,
                HasFile = fileBackedBlock != null || legacyFile != null,
                ExternalLink = material.ExternalLink,
                DurationMinutes = material.DurationMinutes,
                OriginalFileName = fileBackedBlock?.OriginalFileName ?? legacyFile?.OriginalFileName,
                FileSize = fileBackedBlock?.FileSize ?? legacyFile?.FileSize,
                FileContentType = fileBackedBlock?.ContentType ?? legacyFile?.ContentType
            });
        }

        return ApiResponse<PagedResult<LearningMaterialListItemResponse>>.SuccessResult(
            new PagedResult<LearningMaterialListItemResponse>(items, total, page, pageSize));
    }

    public async Task<ApiResponse<LearningMaterialDetailResponse>> CreateAsync(
        CreateLearningMaterialRequest request, int? adminId)
    {
        if (!MaterialContentType.All.Contains(request.ContentType))
        {
            return ApiResponse<LearningMaterialDetailResponse>.FailureResult(
                $"ContentType khong hop le. Chap nhan: {string.Join(", ", MaterialContentType.All)}.");
        }

        if (request.ContentType == MaterialContentType.Text && string.IsNullOrWhiteSpace(request.TextContent))
        {
            return ApiResponse<LearningMaterialDetailResponse>.FailureResult(
                "TextContent khong duoc trong cho hoc lieu loai Text.");
        }

        if (request.ContentType == MaterialContentType.Link && string.IsNullOrWhiteSpace(request.ExternalLink))
        {
            return ApiResponse<LearningMaterialDetailResponse>.FailureResult(
                "ExternalLink khong duoc trong cho hoc lieu loai Link.");
        }

        if (request.DurationMinutes is <= 0)
        {
            return ApiResponse<LearningMaterialDetailResponse>.FailureResult(
                "DurationMinutes phai lon hon 0 neu duoc nhap.");
        }

        var course = await _courseRepo.GetByIdAsync(request.CourseId);
        if (course is null)
        {
            return ApiResponse<LearningMaterialDetailResponse>.FailureResult("Khong tim thay khoa hoc.");
        }

        var material = new LearningMaterial
        {
            CourseId = request.CourseId,
            Title = request.Title,
            ContentType = request.ContentType,
            TextContent = request.TextContent,
            ExternalLink = request.ExternalLink,
            DurationMinutes = request.DurationMinutes,
            Order = request.Order,
            IsDelete = false,
            CreatedDate = DateTime.UtcNow,
            CreatedBy = adminId
        };

        await _materialRepo.AddAsync(material);

        if (_blockRepo != null)
        {
            if (request.ContentType == MaterialContentType.Text && !string.IsNullOrWhiteSpace(request.TextContent))
            {
                await _blockRepo.AddAsync(new LearningMaterialBlock
                {
                    LearningMaterialId = material.Id,
                    BlockType = MaterialBlockType.Text,
                    SortOrder = 1,
                    TextContent = request.TextContent,
                    CreatedDate = DateTime.UtcNow,
                    CreatedBy = adminId
                });
            }
            else if (request.ContentType == MaterialContentType.Link && !string.IsNullOrWhiteSpace(request.ExternalLink))
            {
                await _blockRepo.AddAsync(new LearningMaterialBlock
                {
                    LearningMaterialId = material.Id,
                    BlockType = MaterialBlockType.Link,
                    SortOrder = 1,
                    Url = request.ExternalLink,
                    CreatedDate = DateTime.UtcNow,
                    CreatedBy = adminId
                });
            }
        }

        await _auditLog.LogActionAsync(
            adminId, "CREATE", "LearningMaterial", material.Id,
            null, $"{{\"CourseId\":{material.CourseId},\"Title\":\"{material.Title}\",\"ContentType\":\"{material.ContentType}\"}}");

        return ApiResponse<LearningMaterialDetailResponse>.SuccessResult(
            await BuildDetailAsync(material), "Tao hoc lieu thanh cong.");
    }

    public async Task<ApiResponse<LearningMaterialDetailResponse>> UpdateAsync(
        int id, UpdateLearningMaterialRequest request, int? adminId)
    {
        var material = await _materialRepo.GetByIdAsync(id);
        if (material is null)
            return ApiResponse<LearningMaterialDetailResponse>.FailureResult("Khong tim thay hoc lieu.");

        if (material.ContentType == MaterialContentType.Text && string.IsNullOrWhiteSpace(request.TextContent))
        {
            return ApiResponse<LearningMaterialDetailResponse>.FailureResult(
                "TextContent khong duoc trong cho hoc lieu loai Text.");
        }

        if (material.ContentType == MaterialContentType.Link && string.IsNullOrWhiteSpace(request.ExternalLink))
        {
            return ApiResponse<LearningMaterialDetailResponse>.FailureResult(
                "ExternalLink khong duoc trong cho hoc lieu loai Link.");
        }

        if (request.DurationMinutes is <= 0)
        {
            return ApiResponse<LearningMaterialDetailResponse>.FailureResult(
                "DurationMinutes phai lon hon 0 neu duoc nhap.");
        }

        var before = $"{{\"Title\":\"{material.Title}\",\"Order\":{material.Order}}}";

        material.Title = request.Title;
        material.TextContent = request.TextContent;
        material.ExternalLink = request.ExternalLink;
        if (request.DurationMinutes.HasValue)
        {
            material.DurationMinutes = request.DurationMinutes;
        }
        material.Order = request.Order;
        material.UpdateDate = DateTime.UtcNow;
        material.UpdatedBy = adminId;

        await _materialRepo.UpdateAsync(material);

        await _auditLog.LogActionAsync(
            adminId, "UPDATE", "LearningMaterial", material.Id,
            before, $"{{\"Title\":\"{material.Title}\",\"Order\":{material.Order}}}");

        return ApiResponse<LearningMaterialDetailResponse>.SuccessResult(
            await BuildDetailAsync(material), "Cap nhat hoc lieu thanh cong.");
    }

    public async Task<ApiResponse<object>> DeleteAsync(int id, int? adminId)
    {
        var material = await _materialRepo.GetByIdAsync(id);
        if (material is null)
            return ApiResponse<object>.FailureResult("Khong tim thay hoc lieu.");

        material.IsDelete = true;
        material.UpdateDate = DateTime.UtcNow;
        material.UpdatedBy = adminId;

        await _materialRepo.UpdateAsync(material);

        await _auditLog.LogActionAsync(
            adminId, "DELETE", "LearningMaterial", material.Id,
            $"{{\"Title\":\"{material.Title}\",\"CourseId\":{material.CourseId}}}", null);

        return ApiResponse<object>.SuccessResult(null!, "Xoa hoc lieu thanh cong.");
    }

    public async Task<ApiResponse<List<LearningMaterialBlockResponse>>> GetBlocksAsync(int materialId)
    {
        var material = await _materialRepo.GetByIdAsync(materialId);
        if (material is null)
            return ApiResponse<List<LearningMaterialBlockResponse>>.FailureResult("Khong tim thay hoc lieu.");

        var blocks = await GetMaterialBlocksAsync(material);
        return ApiResponse<List<LearningMaterialBlockResponse>>.SuccessResult(blocks.Select(MapBlock).ToList());
    }

    public async Task<ApiResponse<LearningMaterialBlockResponse>> GetBlockAsync(int materialId, int blockId)
    {
        var block = await GetBlockEntityAsync(materialId, blockId);
        if (block is null)
            return ApiResponse<LearningMaterialBlockResponse>.FailureResult("Khong tim thay khoi noi dung.");

        return ApiResponse<LearningMaterialBlockResponse>.SuccessResult(MapBlock(block));
    }

    public async Task<ApiResponse<LearningMaterialBlockResponse>> AddTextBlockAsync(int materialId, CreateTextMaterialBlockRequest request, int? adminId)
    {
        var material = await _materialRepo.GetByIdAsync(materialId);
        if (material is null)
            return ApiResponse<LearningMaterialBlockResponse>.FailureResult("Khong tim thay hoc lieu.");
        if (_blockRepo is null)
            return ApiResponse<LearningMaterialBlockResponse>.FailureResult("LearningMaterialBlock repository chua duoc cau hinh.");
        if (string.IsNullOrWhiteSpace(request.TextContent))
            return ApiResponse<LearningMaterialBlockResponse>.FailureResult("Noi dung van ban khong duoc trong.");

        var block = new LearningMaterialBlock
        {
            LearningMaterialId = materialId,
            BlockType = MaterialBlockType.Text,
            SortOrder = await ResolveSortOrderAsync(materialId, request.SortOrder),
            TextContent = request.TextContent,
            Caption = request.Caption,
            CreatedDate = DateTime.UtcNow,
            CreatedBy = adminId
        };

        await _blockRepo.AddAsync(block);
        await RefreshMaterialContentTypeAsync(material, adminId);
        await _auditLog.LogActionAsync(adminId, "CREATE_MATERIAL_BLOCK", "LearningMaterialBlock", block.Id, null, $"{{\"MaterialId\":{materialId},\"BlockType\":\"Text\"}}");

        return ApiResponse<LearningMaterialBlockResponse>.SuccessResult(MapBlock(block), "Them khoi van ban thanh cong.");
    }

    public async Task<ApiResponse<LearningMaterialBlockResponse>> AddLinkBlockAsync(int materialId, CreateLinkMaterialBlockRequest request, int? adminId)
    {
        var material = await _materialRepo.GetByIdAsync(materialId);
        if (material is null)
            return ApiResponse<LearningMaterialBlockResponse>.FailureResult("Khong tim thay hoc lieu.");
        if (_blockRepo is null)
            return ApiResponse<LearningMaterialBlockResponse>.FailureResult("LearningMaterialBlock repository chua duoc cau hinh.");
        if (!Uri.TryCreate(request.Url, UriKind.Absolute, out _))
            return ApiResponse<LearningMaterialBlockResponse>.FailureResult("Lien ket khong hop le.");

        var block = new LearningMaterialBlock
        {
            LearningMaterialId = materialId,
            BlockType = MaterialBlockType.Link,
            SortOrder = await ResolveSortOrderAsync(materialId, request.SortOrder),
            Url = request.Url,
            Caption = request.Caption,
            CreatedDate = DateTime.UtcNow,
            CreatedBy = adminId
        };

        await _blockRepo.AddAsync(block);
        await RefreshMaterialContentTypeAsync(material, adminId);
        await _auditLog.LogActionAsync(adminId, "CREATE_MATERIAL_BLOCK", "LearningMaterialBlock", block.Id, null, $"{{\"MaterialId\":{materialId},\"BlockType\":\"Link\"}}");

        return ApiResponse<LearningMaterialBlockResponse>.SuccessResult(MapBlock(block), "Them lien ket thanh cong.");
    }

    public async Task<ApiResponse<LearningMaterialBlockResponse>> AddFileBlockAsync(
        int materialId, UploadMaterialBlockFileForm request, Stream fileStream, string fileName, string contentType, long fileSize, int? adminId)
    {
        var material = await _materialRepo.GetByIdAsync(materialId);
        if (material is null)
            return ApiResponse<LearningMaterialBlockResponse>.FailureResult("Khong tim thay hoc lieu.");
        if (_blockRepo is null || _fileStorage is null)
            return ApiResponse<LearningMaterialBlockResponse>.FailureResult("File storage hoac block repository chua duoc cau hinh.");
        if (!MaterialBlockType.FileBacked.Contains(request.BlockType))
            return ApiResponse<LearningMaterialBlockResponse>.FailureResult("BlockType file khong hop le.");

        var validationError = ValidateFile(request.BlockType, fileName, fileSize);
        if (validationError != null)
            return ApiResponse<LearningMaterialBlockResponse>.FailureResult(validationError);

        var fileKey = await _fileStorage.SaveFileAsync(fileStream, fileName, "materials");
        var block = new LearningMaterialBlock
        {
            LearningMaterialId = materialId,
            BlockType = request.BlockType,
            SortOrder = await ResolveSortOrderAsync(materialId, request.SortOrder),
            Caption = request.Caption,
            FileKey = fileKey,
            OriginalFileName = fileName,
            ContentType = contentType,
            FileSize = fileSize,
            StorageProvider = "LocalFileSystem",
            CreatedDate = DateTime.UtcNow,
            CreatedBy = adminId
        };

        await _blockRepo.AddAsync(block);
        await RefreshMaterialContentTypeAsync(material, adminId);
        await _auditLog.LogActionAsync(adminId, "UPLOAD_MATERIAL_BLOCK_FILE", "LearningMaterialBlock", block.Id, null, $"{{\"MaterialId\":{materialId},\"BlockType\":\"{request.BlockType}\",\"FileName\":\"{fileName}\"}}");

        return ApiResponse<LearningMaterialBlockResponse>.SuccessResult(MapBlock(block), "Upload noi dung thanh cong.");
    }

    public async Task<ApiResponse<LearningMaterialBlockResponse>> UpdateBlockAsync(int materialId, int blockId, UpdateLearningMaterialBlockRequest request, int? adminId)
    {
        var block = await GetBlockEntityAsync(materialId, blockId);
        if (block is null)
            return ApiResponse<LearningMaterialBlockResponse>.FailureResult("Khong tim thay khoi noi dung.");
        if (_blockRepo is null)
            return ApiResponse<LearningMaterialBlockResponse>.FailureResult("LearningMaterialBlock repository chua duoc cau hinh.");

        if (block.BlockType == MaterialBlockType.Text)
        {
            if (string.IsNullOrWhiteSpace(request.TextContent))
                return ApiResponse<LearningMaterialBlockResponse>.FailureResult("Noi dung van ban khong duoc trong.");
            block.TextContent = request.TextContent;
        }
        else if (block.BlockType == MaterialBlockType.Link)
        {
            if (!Uri.TryCreate(request.Url, UriKind.Absolute, out _))
                return ApiResponse<LearningMaterialBlockResponse>.FailureResult("Lien ket khong hop le.");
            block.Url = request.Url;
        }

        if (request.SortOrder.HasValue && request.SortOrder.Value > 0)
        {
            block.SortOrder = request.SortOrder.Value;
        }
        block.Caption = request.Caption;
        block.UpdateDate = DateTime.UtcNow;
        block.UpdatedBy = adminId;

        await _blockRepo.UpdateAsync(block);
        await _auditLog.LogActionAsync(adminId, "UPDATE_MATERIAL_BLOCK", "LearningMaterialBlock", block.Id, null, $"{{\"MaterialId\":{materialId}}}");

        return ApiResponse<LearningMaterialBlockResponse>.SuccessResult(MapBlock(block), "Cap nhat khoi noi dung thanh cong.");
    }

    public async Task<ApiResponse<List<LearningMaterialBlockResponse>>> ReorderBlocksAsync(int materialId, ReorderLearningMaterialBlocksRequest request, int? adminId)
    {
        var material = await _materialRepo.GetByIdAsync(materialId);
        if (material is null)
            return ApiResponse<List<LearningMaterialBlockResponse>>.FailureResult("Khong tim thay hoc lieu.");
        if (_blockRepo is null)
            return ApiResponse<List<LearningMaterialBlockResponse>>.FailureResult("LearningMaterialBlock repository chua duoc cau hinh.");

        var blocks = await _blockRepo.GetByMaterialIdAsync(materialId);
        var blockMap = blocks.ToDictionary(x => x.Id);
        foreach (var item in request.Blocks)
        {
            if (!blockMap.TryGetValue(item.Id, out var block))
                return ApiResponse<List<LearningMaterialBlockResponse>>.FailureResult("Danh sach sap xep co block khong thuoc hoc lieu.");

            block.SortOrder = item.SortOrder < 1 ? 1 : item.SortOrder;
            block.UpdateDate = DateTime.UtcNow;
            block.UpdatedBy = adminId;
        }

        await _blockRepo.UpdateRangeAsync(blocks);
        await _auditLog.LogActionAsync(adminId, "REORDER_MATERIAL_BLOCKS", "LearningMaterial", materialId, null, null);

        blocks = await _blockRepo.GetByMaterialIdAsync(materialId);
        return ApiResponse<List<LearningMaterialBlockResponse>>.SuccessResult(blocks.Select(MapBlock).ToList(), "Da sap xep noi dung.");
    }

    public async Task<ApiResponse<object>> DeleteBlockAsync(int materialId, int blockId, int? adminId)
    {
        var material = await _materialRepo.GetByIdAsync(materialId);
        if (material is null)
            return ApiResponse<object>.FailureResult("Khong tim thay hoc lieu.");
        var block = await GetBlockEntityAsync(materialId, blockId);
        if (block is null)
            return ApiResponse<object>.FailureResult("Khong tim thay khoi noi dung.");
        if (_blockRepo is null)
            return ApiResponse<object>.FailureResult("LearningMaterialBlock repository chua duoc cau hinh.");

        block.IsDelete = true;
        block.UpdateDate = DateTime.UtcNow;
        block.UpdatedBy = adminId;
        await _blockRepo.UpdateAsync(block);

        if (!string.IsNullOrWhiteSpace(block.FileKey) && _fileStorage != null)
        {
            await _fileStorage.DeleteFileAsync(block.FileKey);
        }

        await RefreshMaterialContentTypeAsync(material, adminId);
        await _auditLog.LogActionAsync(adminId, "DELETE_MATERIAL_BLOCK", "LearningMaterialBlock", block.Id, null, $"{{\"MaterialId\":{materialId}}}");

        return ApiResponse<object>.SuccessResult(null!, "Da xoa khoi noi dung.");
    }

    private async Task<LearningMaterialDetailResponse> BuildDetailAsync(LearningMaterial material)
    {
        var files = await _fileRepo.GetByMaterialIdAsync(material.Id);
        var blocks = await GetMaterialBlocksAsync(material);

        return new LearningMaterialDetailResponse
        {
            Id = material.Id,
            CourseId = material.CourseId,
            Title = material.Title,
            ContentType = material.ContentType,
            TextContent = material.TextContent,
            ExternalLink = material.ExternalLink,
            DurationMinutes = material.DurationMinutes,
            Order = material.Order,
            CreatedDate = material.CreatedDate,
            Files = files.Select(f => new MaterialFileResponse
            {
                Id = f.Id,
                LearningMaterialId = f.LearningMaterialId,
                OriginalFileName = f.OriginalFileName,
                FileSize = f.FileSize,
                ContentType = f.ContentType
            }).ToList(),
            Blocks = blocks.Select(MapBlock).ToList()
        };
    }

    private async Task<List<LearningMaterialBlock>> GetMaterialBlocksAsync(LearningMaterial material)
    {
        var blocks = _blockRepo == null
            ? new List<LearningMaterialBlock>()
            : await _blockRepo.GetByMaterialIdAsync(material.Id);

        if (blocks.Count > 0)
            return blocks;

        if (material.ContentType == MaterialContentType.Text && !string.IsNullOrWhiteSpace(material.TextContent))
        {
            return new List<LearningMaterialBlock>
            {
                new()
                {
                    Id = 0,
                    LearningMaterialId = material.Id,
                    BlockType = MaterialBlockType.Text,
                    SortOrder = 1,
                    TextContent = material.TextContent
                }
            };
        }

        if (material.ContentType == MaterialContentType.Link && !string.IsNullOrWhiteSpace(material.ExternalLink))
        {
            return new List<LearningMaterialBlock>
            {
                new()
                {
                    Id = 0,
                    LearningMaterialId = material.Id,
                    BlockType = MaterialBlockType.Link,
                    SortOrder = 1,
                    Url = material.ExternalLink
                }
            };
        }

        return blocks;
    }

    private async Task<LearningMaterialBlock?> GetBlockEntityAsync(int materialId, int blockId)
    {
        if (_blockRepo is null)
            return null;

        var block = await _blockRepo.GetByIdAsync(blockId);
        return block != null && block.LearningMaterialId == materialId ? block : null;
    }

    private async Task<int> ResolveSortOrderAsync(int materialId, int? requested)
    {
        if (requested.HasValue && requested.Value > 0)
            return requested.Value;

        if (_blockRepo is null)
            return 1;

        var blocks = await _blockRepo.GetByMaterialIdAsync(materialId);
        return blocks.Count == 0 ? 1 : blocks.Max(x => x.SortOrder) + 1;
    }

    private async Task RefreshMaterialContentTypeAsync(LearningMaterial material, int? adminId)
    {
        if (_blockRepo is null)
            return;

        var blocks = await _blockRepo.GetByMaterialIdAsync(material.Id);
        if (blocks.Count == 0)
            return;

        var types = blocks.Select(x => x.BlockType).Distinct(StringComparer.OrdinalIgnoreCase).ToList();
        material.ContentType = types.Count == 1 ? types[0] : MaterialContentType.Mixed;
        material.UpdateDate = DateTime.UtcNow;
        material.UpdatedBy = adminId;
        await _materialRepo.UpdateAsync(material);
    }

    private string? ValidateFile(string blockType, string fileName, long fileSize)
    {
        var extension = Path.GetExtension(fileName);
        var allowedExtensions = blockType switch
        {
            MaterialBlockType.Image => ImageExtensions,
            MaterialBlockType.Video => VideoExtensions,
            MaterialBlockType.Pdf => PdfExtensions,
            _ => FileExtensions
        };

        if (!allowedExtensions.Contains(extension))
            return $"Dinh dang file khong hop le cho block {blockType}.";

        var maxBytes = blockType switch
        {
            MaterialBlockType.Image => GetConfiguredLong("Storage:MaxImageBytes", 10 * 1024 * 1024),
            MaterialBlockType.Video => GetConfiguredLong("Storage:MaxVideoBytes", 200 * 1024 * 1024),
            MaterialBlockType.Pdf => GetConfiguredLong("Storage:MaxPdfBytes", 50 * 1024 * 1024),
            _ => GetConfiguredLong("Storage:MaxFileBytes", 50 * 1024 * 1024)
        };

        if (fileSize <= 0 || fileSize > maxBytes)
            return $"Dung luong file phai lon hon 0 va khong vuot qua {Math.Round(maxBytes / 1024m / 1024m, 0)}MB.";

        return null;
    }

    private long GetConfiguredLong(string key, long fallback)
    {
        if (_configuration == null)
            return fallback;

        return long.TryParse(_configuration[key], out var value) && value > 0 ? value : fallback;
    }

    private static LearningMaterialBlockResponse MapBlock(LearningMaterialBlock block)
    {
        var fileBacked = IsFileBackedBlock(block);
        return new LearningMaterialBlockResponse
        {
            Id = block.Id,
            LearningMaterialId = block.LearningMaterialId,
            BlockType = block.BlockType,
            SortOrder = block.SortOrder,
            TextContent = block.TextContent,
            Url = block.Url,
            Caption = block.Caption,
            FileKey = block.FileKey,
            OriginalFileName = block.OriginalFileName,
            ContentType = block.ContentType,
            FileSize = block.FileSize,
            CanStream = block.Id > 0 && !string.IsNullOrWhiteSpace(block.FileKey)
                && (block.BlockType == MaterialBlockType.Image || block.BlockType == MaterialBlockType.Video || block.BlockType == MaterialBlockType.Pdf),
            CanDownload = block.Id > 0 && fileBacked
        };
    }

    private static bool IsFileBackedBlock(LearningMaterialBlock block)
    {
        return MaterialBlockType.FileBacked.Contains(block.BlockType) && !string.IsNullOrWhiteSpace(block.FileKey);
    }
}
