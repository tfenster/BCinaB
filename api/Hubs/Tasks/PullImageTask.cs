using System;
using System.Threading;
using System.Threading.Tasks;
using api.Hubs;
using api.Models;
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
        private RegistryCredentials _regCreds;

        public PullImageTask(string fqin, string tag, RegistryCredentials regCreds)
        {
            _fqin = fqin;
            _tag = tag;
            _regCreds = regCreds;
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
            AuthConfig authConfig = null;
            if (_regCreds != null)
            {
                authConfig = new AuthConfig()
                {
                    ServerAddress = _regCreds.Registry,
                    Username = _regCreds.Username,
                    Password = _regCreds.Password
                };
            }
            await GetClient().Images.CreateImageAsync(
                new ImagesCreateParameters()
                {
                    FromImage = _fqin,
                    Tag = _tag
                },
                authConfig,
                progress,
                _cancellation.Token
            );
            await _signalrClients.Client(_connectionId).SendAsync("pullFinished");
        }
    }
}