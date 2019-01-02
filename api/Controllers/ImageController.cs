using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using api.Models;
using Docker.DotNet;
using Docker.DotNet.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;

namespace api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ImageController : ControllerBase
    {
        private DockerClient _client;

        private IConfiguration _configuration;

        public ImageController(IConfiguration Configuration)
        {
            _configuration = Configuration;
        }

        // GET api/image
        [HttpGet]
        public async Task<ActionResult<IList<ImagesListResponse>>> Get()
        {
            var images = await GetClient().Images.ListImagesAsync(
                new ImagesListParameters()
                {
                    All = true,
                });
            return Ok(images);
        }

        private DockerClient GetClient()
        {
            if (_client == null)
                _client = new DockerClientConfiguration(new System.Uri(_configuration["EngineEndpoint"])).CreateClient();
            return _client;
        }
    }

}