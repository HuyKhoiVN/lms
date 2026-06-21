using Microsoft.AspNetCore.Mvc;

namespace lms.WebMvc.Controllers
{
    public class LearningMaterialsController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }

        public IActionResult Viewer(int id)
        {
            ViewData["MaterialId"] = id;
            return View();
        }
    }
}
