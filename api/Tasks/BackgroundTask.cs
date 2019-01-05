using System.Threading;
using System.Threading.Tasks;
using Docker.DotNet;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Configuration;

namespace api.Tasks
{

    public abstract class BackgroundTask
    {
        protected IConfiguration _configuration;
        protected DockerClient _client;
        protected IHubCallerClients _signalrClients;
        protected CancellationTokenSource _cancellation;
        protected string _connectionId;
        protected string _myGuid;

        public void SetBasics(IHubCallerClients clients, IConfiguration configuration, string myGuid,
            CancellationTokenSource cancellation, string connectionId)
        {
            _signalrClients = clients;
            _configuration = configuration;
            _myGuid = myGuid;
            _cancellation = cancellation;
            _connectionId = connectionId;
        }

        public abstract Task DoStuff();

        protected DockerClient GetClient()
        {
            if (_client == null)
            {
                _client = new DockerClientConfiguration(new System.Uri(_configuration["EngineEndpoint"])).CreateClient();
            }
            return _client;
        }
    }
}