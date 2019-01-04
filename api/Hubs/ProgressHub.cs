using Docker.DotNet;
using Docker.DotNet.Models;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace api.Hubs
{
    public class ProgressHub : Hub
    {
        private IConfiguration _configuration;
        private static readonly UTF8Encoding Utf8EncodingWithoutBom = new UTF8Encoding(false);
        private static IDictionary<string, CancellationTokenSource> _tokens = new Dictionary<string, CancellationTokenSource>();
        private static IDictionary<string, DateTime> _keepAlives = new Dictionary<string, DateTime>();

        public ProgressHub(IConfiguration configuration)
        {
            this._configuration = configuration;
        }

        public async void GetLog(string id)
        {
            /*CancellationTokenSource cancellation = new CancellationTokenSource();
            var myGuid = Guid.NewGuid().ToString();
            _tokens.Add(myGuid, cancellation);
            await Clients.Caller.SendAsync("log", myGuid);

            using (var logs = await GetClient().Containers.GetContainerLogsAsync(id, new ContainerLogsParameters
            {
                ShowStderr = true,
                ShowStdout = true,
            }, cancellation.Token))
            {
                using (var reader = new StreamReader(logs, Utf8EncodingWithoutBom))
                {
                    string nextLine;
                    while ((nextLine = await reader.ReadLineAsync()) != null)
                    {
                        if (IsBroken(myGuid))
                        {
                            Console.WriteLine("timeout");
                        }
                        else
                        {
                            await Clients.Caller.SendAsync("log", nextLine);
                        }
                    }
                }
            }*/
        }

        public void KeepAlive(string guid)
        {
            _keepAlives[guid] = DateTime.Now;
        }

        public static bool IsBroken(string guid)
        {
            return _keepAlives[guid].AddSeconds(10) < DateTime.Now;
        }

        public async void PullImage(string fqin, string tag)
        {
            CancellationTokenSource cancellation = new CancellationTokenSource();
            var myGuid = Guid.NewGuid().ToString();
            _keepAlives[myGuid] = DateTime.Now;
            _tokens.Add(myGuid, cancellation);
            PullImage pi = new PullImage(Clients, _configuration);
            await pi.pull(myGuid, cancellation, fqin, tag, Context.ConnectionId);
        }

        public void Cancel(string guid)
        {
            if (_tokens.ContainsKey(guid))
            {
                var tokenSource = _tokens[guid];
                tokenSource.Cancel();
            }
        }
    }
}