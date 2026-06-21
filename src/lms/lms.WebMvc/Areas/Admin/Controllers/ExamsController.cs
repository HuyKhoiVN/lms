using Microsoft.AspNetCore.Mvc;

namespace lms.WebMvc.Areas.Admin.Controllers
{
    [Area("Admin")]
    public class ExamsController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }

        public IActionResult Builder(int? id)
        {
            ViewData["ExamId"] = id ?? 0;
            return View();
        }

        public IActionResult Assignment()
        {
            return RedirectToAction(nameof(Index));
        }
    }
}
