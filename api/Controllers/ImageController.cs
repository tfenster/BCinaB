using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using api.Models;
using api.Services;
using Docker.DotNet;
using Docker.DotNet.Models;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;

namespace api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ImageController : ControllerBase
    {
        private DockerClient _client;
        private IConfiguration _configuration;
        private IProtectorService<RegistryCredentials> _protectorService;

        public ImageController(IConfiguration Configuration, IProtectorService<RegistryCredentials> protectorService)
        {
            _configuration = Configuration;
            _protectorService = protectorService;
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

        [HttpPost("[action]/")]
        public ActionResult RegistryCredentials(RegistryCredentials regCreds)
        {
            try
            {
                _protectorService.ProtectAndStore(regCreds.Registry, regCreds);
                return Ok();
            }
            catch (Exception ex)
            {
                return BadRequest("Couldn't store credentials: " + ex.Message);
            }
        }

        private DockerClient GetClient()
        {
            if (_client == null)
                _client = new DockerClientConfiguration(new System.Uri(_configuration["EngineEndpoint"])).CreateClient();
            return _client;
        }
    }

}