using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using lms.Application.Interfaces.Repositories;
using lms.Domain.Entities;
using lms.Persistence.Context;

namespace lms.Persistence.Repositories;

public class AuditLogRepository : IAuditLogRepository
{
    private readonly LmsDbContext _context;

    public AuditLogRepository(LmsDbContext context)
    {
        _context = context;
    }

    public async Task AddAsync(AuditLog auditLog)
    {
        await _context.AuditLogs.AddAsync(auditLog);
        await _context.SaveChangesAsync();
    }

    public async Task<AuditLog?> GetByIdAsync(int id)
    {
        return await _context.AuditLogs
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id);
    }

    public async Task<List<AuditLog>> GetPagedAsync(
        int? userId, string? action, string? entityName, DateTime? fromDate, DateTime? toDate, int page, int pageSize)
    {
        var query = _context.AuditLogs.AsNoTracking();

        if (userId.HasValue)
        {
            query = query.Where(al => al.UserId == userId.Value);
        }

        if (!string.IsNullOrWhiteSpace(action))
        {
            query = query.Where(al => al.Action == action);
        }

        if (!string.IsNullOrWhiteSpace(entityName))
        {
            query = query.Where(al => al.EntityName == entityName);
        }

        if (fromDate.HasValue)
        {
            query = query.Where(al => al.CreatedDate >= fromDate.Value);
        }

        if (toDate.HasValue)
        {
            query = query.Where(al => al.CreatedDate <= toDate.Value);
        }

        return await query
            .OrderByDescending(al => al.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
    }

    public async Task<int> GetCountAsync(int? userId, string? action, string? entityName, DateTime? fromDate, DateTime? toDate)
    {
        var query = _context.AuditLogs.AsNoTracking();

        if (userId.HasValue)
        {
            query = query.Where(al => al.UserId == userId.Value);
        }

        if (!string.IsNullOrWhiteSpace(action))
        {
            query = query.Where(al => al.Action == action);
        }

        if (!string.IsNullOrWhiteSpace(entityName))
        {
            query = query.Where(al => al.EntityName == entityName);
        }

        if (fromDate.HasValue)
        {
            query = query.Where(al => al.CreatedDate >= fromDate.Value);
        }

        if (toDate.HasValue)
        {
            query = query.Where(al => al.CreatedDate <= toDate.Value);
        }

        return await query.CountAsync();
    }
}
