using Microsoft.AspNetCore.Mvc;

namespace lms.WebMvc.Controllers
{
    public class ExamsController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }

        public IActionResult Start(int id)
        {
            ViewData["ExamId"] = id;
            return View();
        }

        public IActionResult Take(int id)
        {
            ViewData["ExamId"] = id;
            return View();
        }
    }
}
