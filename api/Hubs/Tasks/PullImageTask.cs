using System;
using System.Threading;
using System.Threading.Tasks;
using api.Hubs;
using Docker.DotNet;
using Docker.DotNet.Models;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Configuration;

namespace api.Hubs.Tasks
{

    public class PullImageTask : BackgroundTask
    {
        private string _fqin;
        private string _tag;

        public PullImageTask(string fqin, string tag)
        {
            _fqin = fqin;
            _tag = tag;
        }

        public async override Task DoStuff()
        {
            await _signalrClients.Client(_connectionId).SendAsync("pullGuid", _myGuid);
            var progress = new Progress<JSONMessage>(async message =>
            {
                if (ProgressHub.IsBroken(_myGuid))
                {
                    _cancellation.Cancel();
                }
                else
                {
                    await _signalrClients.Client(_connectionId).SendAsync("pullProgress", message);
                }
            });
            await GetClient().Images.CreateImageAsync(
                new ImagesCreateParameters()
                {
                    FromImage = _fqin,
                    Tag = _tag
                },
                null,
                progress,
                _cancellation.Token
            );
            await _signalrClients.Client(_connectionId).SendAsync("pullFinished");
        }
    }
}