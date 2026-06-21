using Microsoft.AspNetCore.Mvc;

namespace lms.WebMvc.Areas.Admin.Controllers
{
    [Area("Admin")]
    public class CoursesController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }

        public IActionResult Detail(int id)
        {
            ViewData["CourseId"] = id;
            return View();
        }
    }
}
