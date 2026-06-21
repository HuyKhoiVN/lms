using Microsoft.AspNetCore.Mvc;

namespace lms.WebMvc.Areas.Admin.Controllers
{
    [Area("Admin")]
    public class GroupsController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }

        public IActionResult Detail(int id)
        {
            ViewData["GroupId"] = id;
            return View();
        }
    }
}
