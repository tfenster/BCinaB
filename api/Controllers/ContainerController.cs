using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using System.Web.Http;
using api.Models;
using Docker.DotNet;
using Docker.DotNet.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;

namespace api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ContainerController : ControllerBase
    {
        private DockerClient _client;

        private IConfiguration _configuration;

        public ContainerController(IConfiguration Configuration)
        {
            _configuration = Configuration;
        }

        // GET api/container
        [HttpGet]
        public async Task<ActionResult<IList<ContainerListResponse>>> Get()
        {
            var containers = await GetClient().Containers.ListContainersAsync(
                new ContainersListParameters()
                {
                    All = true,
                }
            );
            return Ok(containers);
        }

        [HttpGet("[action]/")]
        public async Task<ActionResult<ContainerInspectResponse>> Details(string id)
        {
            var container = await GetClient().Containers.InspectContainerAsync(id);
            return Ok(container);
        }

        [HttpPost("[action]/")]
        public async Task<ActionResult> Start(string id)
        {
            var started = false;
            try
            {
                started = await GetClient().Containers.StartContainerAsync(id,
                        new ContainerStartParameters() { }
                    );
                if (started)
                    return Ok(id);
                else
                    return BadRequest($"could not start {id}");
            }
            catch (Exception ex)
            {
                return BadRequest($"An error occured: {ex.Message}");
            }
        }

        [HttpPost("[action]/")]
        public async Task<ActionResult> Stop(string id)
        {
            var started = false;
            try
            {
                started = await GetClient().Containers.StopContainerAsync(id,
                        new ContainerStopParameters() { }
                    );
                if (started)
                    return Ok(id);
                else
                    return BadRequest($"could not stop {id}");
            }
            catch (Exception ex)
            {
                return BadRequest($"An error occured: {ex.Message}");
            }
        }

        [HttpPost("[action]/")]
        public async Task<ActionResult> Exec(string id)
        {
            try
            {
                /* var resp = await GetClient().Containers.ExecCreateContainerAsync(id,
                        new ContainerExecCreateParameters()
                        {
                            AttachStderr = true,
                            AttachStdin = true,
                            AttachStdout = true,
                            Tty = true,
                            Cmd = new List<string>() { "powershell" }
                        }
                    );

                var multiplexedStreams = await GetClient().Containers.StartAndAttachContainerExecAsync(resp.ID, true);

                multiplexedStreams.CopyOutputToAsync()*/

                try
                {
                    var resp = await GetClient().Containers.ExecCreateContainerAsync(id,
                        new ContainerExecCreateParameters()
                        {
                            AttachStderr = true,
                            AttachStdin = true,
                            AttachStdout = true,
                            Tty = true,
                            Cmd = new List<string>() { "powershell" }
                        }
                    );

                    var multiplexedStreams = await GetClient().Containers.StartAndAttachContainerExecAsync(resp.ID, true);
                    using (MemoryStream stdOut = new MemoryStream(), stdErr = new MemoryStream(), stdIn = new MemoryStream())
                    {
                        var streamTask = multiplexedStreams.CopyOutputToAsync(stdIn, stdOut, stdErr, CancellationToken.None);


                        stdOut.Position = 0;
                        stdErr.Position = 0;

                        using (StreamReader outRdr = new StreamReader(stdOut), errRdr = new StreamReader(stdErr))
                        using (StreamWriter inWrt = new StreamWriter(stdIn))
                        {
                            //stdIn
                            await streamTask;
                            inWrt.WriteLine("powershell");
                            var stdOutString = outRdr.ReadLine();
                            var stdErrString = errRdr.ReadLine();
                            Console.WriteLine("stdout: " + stdOutString);
                            Console.WriteLine("stderr: " + stdErrString);
                        }
                    }
                }
                catch (Exception exception)
                {
                    Console.Write(exception.Message);
                }

                return Ok(id);
            }
            catch (Exception ex)
            {
                return BadRequest($"An error occured: {ex.Message}");
            }
        }

        [HttpPost("[action]/")]
        public async Task<ActionResult> Restart(string id)
        {
            try
            {
                await GetClient().Containers.RestartContainerAsync(id,
                        new ContainerRestartParameters() { }
                    );
                return Ok(id);
            }
            catch (Exception ex)
            {
                return BadRequest($"An error occured: {ex.Message}");
            }
        }

        [HttpDelete]
        public async Task<ActionResult> Delete(string id)
        {
            try
            {
                await GetClient().Containers.RemoveContainerAsync(id,
                    new ContainerRemoveParameters()
                    {
                        Force = true
                    }
                );
                return Ok();
            }
            catch (Exception ex)
            {
                return BadRequest($"An error occured: {ex.Message}");
            }
        }

        // POST api/container
        [HttpPost]
        public async Task<ActionResult<string>> Post(BCContainer container)
        {
            var images = await GetClient().Images.ListImagesAsync(new ImagesListParameters()
            {
                All = true,
            });
            var tag = ":latest";
            var repo = "";
            var reg = "";
            if (container.Registry != null && container.Registry != "")
                reg = $"{container.Registry}/";
            if (container.Repository != null && container.Repository != "")
                repo = $"{container.Repository}/";
            if (container.Tag != null && container.Tag != "")
                tag = $":{container.Tag}";
            var fqin = $"{reg}{repo}{container.Image}{tag}";
            var image = images.Where(i => i.RepoTags != null && i.RepoTags.Count > 0 && i.RepoTags[0] == fqin).FirstOrDefault();
            if (image == null)
            {
                return Ok("image not available locally");
            }

            var sysInfo = await GetClient().System.GetSystemInfoAsync();
            try
            {
                var Env = new List<string>();
                Env = Env.Union(container.Env).ToList<string>();

                var hostConf = new HostConfig();
                if (sysInfo.Isolation == "hyperv")
                {
                    hostConf.Memory = 4294967296; // 4G
                }

                if (container.Navcontainerhelper)
                {
                    var basePath = "c:\\programdata\\navcontainerhelper";
                    var specificPart = "\\extensions\\" + container.Name + "\\my";
                    var myPath = basePath + specificPart;

                    if (Directory.Exists(basePath))  // this should be bound as volume
                    {
                        if (!Directory.Exists(myPath))
                            Directory.CreateDirectory(myPath);
                    }

                    hostConf.Binds = new List<string>();
                    hostConf.Binds.Add($"{myPath}:c:\\run\\my");
                    hostConf.Binds.Add($"{basePath}:{basePath}");
                }

                var Labels = new Dictionary<string, string>();
                Labels.Add("bcinab.guidef", $"{container.GuiDef}");

                var createResp = await GetClient().Containers.CreateContainerAsync(
                    new CreateContainerParameters()
                    {
                        Image = fqin,
                        Env = Env,
                        HostConfig = hostConf,
                        Name = container.Name,
                        Hostname = container.Name,
                        Labels = Labels
                    }
                );
                var started = await GetClient().Containers.StartContainerAsync(createResp.ID,
                    new ContainerStartParameters() { }
                );
                if (started)
                    return Ok(createResp.ID);
                else
                    return BadRequest($"could not start {createResp.ID}");
            }
            catch (Exception ex)
            {
                return BadRequest($"An error occured: {ex.Message}");
            }
        }

        private void LogProgress(JSONMessage json)
        {
            Console.WriteLine($"{json.ID} - {json.From} - {json.ProgressMessage} - {json.Status} - {json.Stream}");
            if (json.Progress != null)
                Console.WriteLine($"    {json.Progress.Start} - {json.Progress.Current} - {json.Progress.Total}");
        }

        private DockerClient GetClient()
        {
            if (_client == null)
                _client = new DockerClientConfiguration(new System.Uri(_configuration["EngineEndpoint"])).CreateClient();
            return _client;
        }
    }

}