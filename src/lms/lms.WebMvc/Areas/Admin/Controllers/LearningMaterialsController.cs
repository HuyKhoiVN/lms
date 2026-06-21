using Microsoft.AspNetCore.Mvc;

namespace lms.WebMvc.Areas.Admin.Controllers
{
    [Area("Admin")]
    public class LearningMaterialsController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}
