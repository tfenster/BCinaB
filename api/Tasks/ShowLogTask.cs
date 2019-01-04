using System;
using System.IO;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using api.Hubs;
using Docker.DotNet;
using Docker.DotNet.Models;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Configuration;

namespace api.Tasks
{

    public class ShowLogTask : BackgroundTask
    {
        private string _id;
        private static readonly UTF8Encoding Utf8EncodingWithoutBom = new UTF8Encoding(false);

        public ShowLogTask(string id)
        {
            _id = id;
        }

        public async override Task DoStuff()
        {
            await _signalrClients.Client(_connectionId).SendAsync("logGuid", _myGuid);

            using (var logs = await GetClient().Containers.GetContainerLogsAsync(_id, new ContainerLogsParameters
            {
                ShowStderr = true,
                ShowStdout = true,
            }, _cancellation.Token))
            {
                using (var reader = new StreamReader(logs, Utf8EncodingWithoutBom))
                {
                    string nextLine;
                    while ((nextLine = await reader.ReadLineAsync()) != null)
                    {
                        if (!ProgressHub.IsBroken(_myGuid))
                        {
                            await _signalrClients.Client(_connectionId).SendAsync("log", nextLine);
                        }
                    }
                }
            }
        }
    }
}