using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using lms.Domain.Entities;

namespace lms.Application.Interfaces.Repositories;

public interface IAuditLogRepository
{
    Task AddAsync(AuditLog auditLog);
    Task<AuditLog?> GetByIdAsync(int id);
    Task<List<AuditLog>> GetPagedAsync(
        int? userId, string? action, string? entityName, DateTime? fromDate, DateTime? toDate, int page, int pageSize);
    Task<int> GetCountAsync(int? userId, string? action, string? entityName, DateTime? fromDate, DateTime? toDate);
}
