using Microsoft.AspNetCore.Mvc;

namespace lms.WebMvc.Controllers
{
    public class ResultsController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }

        public IActionResult Detail(string id)
        {
            ViewData["ResultId"] = id;
            return View();
        }
    }
}
