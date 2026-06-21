using Microsoft.AspNetCore.Mvc;

namespace lms.WebMvc.Controllers
{
    public class AuthController : Controller
    {
        public IActionResult Login()
        {
            return View();
        }

        public IActionResult ChangePassword()
        {
            return View();
        }
    }
}
