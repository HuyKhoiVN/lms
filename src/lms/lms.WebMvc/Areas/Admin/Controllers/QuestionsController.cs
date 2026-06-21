using Microsoft.AspNetCore.Mvc;

namespace lms.WebMvc.Areas.Admin.Controllers
{
    [Area("Admin")]
    public class QuestionsController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}
