using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading;
using Docker.DotNet;
using Docker.DotNet.Models;
using Microsoft.Extensions.Configuration;

namespace api.Services
{
    public interface IEngineMonitorService
    {
        void ListenToEngine();
        void CancelListening();
    }

    public class EngineMonitorService : IEngineMonitorService
    {
        private IConfiguration _configuration;
        private DockerClient _client;
        private CancellationTokenSource _cts;
        private IDictionary<string, DateTime> _adds = new Dictionary<string, DateTime>();
        private IDictionary<string, DateTime> _removes = new Dictionary<string, DateTime>();
        private string _hostsPath;

        public EngineMonitorService(IConfiguration Configuration)
        {
            _configuration = Configuration;
            _hostsPath = _configuration["HostsFile"];
            ListenToEngine();
        }

        public async void ListenToEngine()
        {
            var progress = new Progress<JSONMessage>(message =>
            {
                if (message.Status == "stop" || message.Status == "kill")
                {
                    if (ShouldHandle(message, _removes))
                    {
                        HandleHosts(false, message);
                    }
                }
                if (message.Status == "start")
                {
                    if (ShouldHandle(message, _adds))
                    {
                        HandleHosts(true, message);
                    }
                }
            });
            _cts = new CancellationTokenSource();
            await GetClient().System.MonitorEventsAsync(new ContainerEventsParameters(), progress, _cts.Token);
        }

        private void HandleHosts(bool add, JSONMessage message)
        {
            FileStream hostsFileStream = null;
            try
            {

                while (hostsFileStream == null)
                {
                    int tryCount = 0;
                    try
                    {
                        hostsFileStream = File.Open(_hostsPath, FileMode.Open, FileAccess.ReadWrite, FileShare.Read);
                    }
                    catch (FileNotFoundException)
                    {
                        // no access to hosts
                        Console.WriteLine("could not change hosts file");
                        return;
                    }
                    catch (UnauthorizedAccessException)
                    {
                        // no access to hosts
                        Console.WriteLine("could not change hosts file");
                        return;
                    }
                    catch (IOException)
                    {
                        if (tryCount == 5)
                        {
                            Console.WriteLine("could not change hosts file");
                            return;  // only try five times and then give up
                        }
                        Thread.Sleep(1000);
                        tryCount++;
                    }
                }

                var response = GetClient().Containers.InspectContainerAsync(message.ID).Result;
                var networks = response.NetworkSettings.Networks;
                EndpointSettings network = null;
                if (networks.TryGetValue("nat", out network))
                {
                    var hostsLines = new List<string>();
                    using (StreamReader reader = new StreamReader(hostsFileStream))
                    using (StreamWriter writer = new StreamWriter(hostsFileStream))
                    {
                        while (!reader.EndOfStream)
                            hostsLines.Add(reader.ReadLine());

                        hostsFileStream.Position = 0;
                        var removed = hostsLines.RemoveAll(l => l.EndsWith($"#{message.ID} by BCinaB"));

                        if (add)
                            hostsLines.Add($"{network.IPAddress}\t{response.Config.Hostname}\t\t#{message.ID} by BCinaB");

                        foreach (var line in hostsLines)
                            writer.WriteLine(line);
                        hostsFileStream.SetLength(hostsFileStream.Position);
                    }
                }
            }
            finally
            {
                if (hostsFileStream != null)
                    hostsFileStream.Dispose();
            }
        }

        private bool ShouldHandle(JSONMessage message, IDictionary<string, DateTime> dict)
        {
            if (message.ID == null || message.ID == "")
                return false;

            DateTime lastRemove;
            DateTime now = DateTime.Now;
            lock (dict)
            {
                if (dict.TryGetValue(message.ID, out lastRemove))
                {
                    dict.Remove(message.ID);
                    if (lastRemove.AddSeconds(7) > now)
                        return false;    // repeated calls in < 7s will be ignored
                }
                dict.Add(message.ID, now);
            }
            return true;
        }

        public void CancelListening()
        {
            if (_cts != null)
                _cts.Cancel();
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
}