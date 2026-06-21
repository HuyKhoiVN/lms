using Microsoft.AspNetCore.Mvc;

namespace lms.WebMvc.Controllers
{
    public class CertificatesController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}
