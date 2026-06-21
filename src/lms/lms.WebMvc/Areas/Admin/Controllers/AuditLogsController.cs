using Microsoft.AspNetCore.Mvc;

namespace lms.WebMvc.Areas.Admin.Controllers
{
    [Area("Admin")]
    public class AuditLogsController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}
