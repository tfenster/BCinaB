using Docker.DotNet;
using Docker.DotNet.Models;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Configuration;
using System;
using System.Threading.Tasks;

namespace api.Hubs
{
    public class ProgressHub : Hub
    {
        private DockerClient _client;
        private IConfiguration _configuration;

        public ProgressHub(IConfiguration configuration)
        {
            this._configuration = configuration;
        }

        public async Task PullImage(string fqin, string tag)
        {
            var progress = new Progress<JSONMessage>(async message =>
            {
                await Clients.Caller.SendAsync("pullProgress", message);
            });
            await GetClient().Images.CreateImageAsync(
                new ImagesCreateParameters()
                {
                    FromImage = fqin,
                    Tag = tag
                },
                null,
                progress
            );
            await Clients.Caller.SendAsync("pullFinished");
        }

        private DockerClient GetClient()
        {
            if (_client == null)
                _client = new DockerClientConfiguration(new System.Uri(_configuration["EngineEndpoint"])).CreateClient();
            return _client;
        }
    }
}