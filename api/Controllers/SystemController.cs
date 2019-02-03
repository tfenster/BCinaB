using System;
using System.Collections.Generic;
using System.IO;
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
    public class SystemController : ControllerBase
    {
        private DockerClient _client;
        private IConfiguration _configuration;

        public SystemController(IConfiguration Configuration)
        {
            _configuration = Configuration;
        }

        // GET api/system
        [HttpGet]
        public async Task<ActionResult<SystemInfo>> Get()
        {
            var systemInfoResponse = await GetClient().System.GetSystemInfoAsync();
            var versionResponse = await GetClient().System.GetVersionAsync();
            return Ok(new SystemInfo()
            {
                SystemInfoResponse = systemInfoResponse,
                VersionResponse = versionResponse
            });
        }

        // GET api/system
        [HttpGet("[action]/")]
        public ActionResult<bool> Navcontainerhelper()
        {
            return Ok(Directory.Exists("C:\\programdata\\navcontainerhelper"));
        }

        // GET api/system
        [HttpGet("[action]/")]
        public async Task<ActionResult<IList<NetworkResponse>>> Networks()
        {
            try
            {
                var resp = await GetClient().Networks.ListNetworksAsync();
                return Ok(resp);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }

        }

        // GET api/system
        [HttpGet("[action]/")]
        public ActionResult<IList<string>> CredentialSpecs()
        {
            try
            {
                var resp = new List<string>();
                string[] files = Directory.GetFiles(@"c:\programdata\dockercredspecs\", "*.json");
                foreach (var file in files)
                {
                    resp.Add(file.Substring(file.LastIndexOf(@"\") + 1));
                }
                return Ok(resp);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
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