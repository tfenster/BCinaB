using System;
using System.Threading;
using System.Threading.Tasks;
using api.Hubs;
using Docker.DotNet;
using Docker.DotNet.Models;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Configuration;

public class PullImage
{
    private IConfiguration _configuration;
    private DockerClient _client;
    private IHubCallerClients _signalrClients;
    public PullImage(IHubCallerClients clients, IConfiguration configuration)
    {
        _signalrClients = clients;
        _configuration = configuration;
    }

    public async Task pull(string myGuid, CancellationTokenSource cancellation, string fqin, string tag, string connectionId)
    {
        await _signalrClients.Client(connectionId).SendAsync("pullGuid", myGuid);
        var i = 0;
        var progress = new Progress<JSONMessage>(async message =>
        {
            if (ProgressHub.IsBroken(myGuid))
            {
                cancellation.Cancel();
            }
            else
            {
                await _signalrClients.Client(connectionId).SendAsync("pullProgress", message);
                // DELETEME
                i += 1;
            }
        });
        await GetClient().Images.CreateImageAsync(
            new ImagesCreateParameters()
            {
                FromImage = fqin,
                Tag = tag
            },
            null,
            progress,
            cancellation.Token
        );
        await _signalrClients.Client(connectionId).SendAsync("pullFinished");
    }


    private DockerClient GetClient()
    {
        if (_client == null)
        {
            _client = new DockerClientConfiguration(new System.Uri(_configuration["EngineEndpoint"])).CreateClient();
        }
        return _client;
    }
}