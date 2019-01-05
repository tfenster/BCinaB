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
using System.Linq;

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
                Follow = true,
                Tail = "200",
                Timestamps = false,
            }, _cancellation.Token))
            {
                byte[] eight = new byte[8];
                bool foundData = false;
                while (logs.Read(eight, 0, 8) == 8)
                {
                    byte[] lastFour = eight.TakeLast(4).ToArray();
                    Array.Reverse(lastFour);
                    int size = BitConverter.ToInt32(lastFour, 0);

                    byte[] lineBytes = new byte[size];
                    logs.Read(lineBytes, 0, size);
                    string line = System.Text.Encoding.UTF8.GetString(lineBytes);
                    if (!foundData && line.Length > 0 && !line.StartsWith("Error grabbing logs: EOF"))
                        foundData = true;
                    if ((!foundData && line.Length == 0) || (line == "Error grabbing logs: EOF"))
                    {
                        await _signalrClients.Client(_connectionId).SendAsync("No data found. Either the container has not yet produced logs or the URL is wrong");
                    }

                    if (foundData)
                    {
                        /* string timestampS = line.Substring(0, 30);
                        DateTime timestamp = DateTime.Parse(timestampS);
                        line = timestamp.ToString("yyyy-MM-dd HH:mm:ss") + "   " + line.Substring(31);*/

                        if (!ProgressHub.IsBroken(_myGuid))
                        {
                            await _signalrClients.Client(_connectionId).SendAsync("log", line);
                        }

                    }
                }
            }
        }
    }
}