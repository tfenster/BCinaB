using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Text;
using System.Threading;
using api.Tasks;

namespace api.Hubs
{
    public class ProgressHub : Hub
    {
        private IConfiguration _configuration;
        private static IDictionary<string, CancellationTokenSource> _tokens = new Dictionary<string, CancellationTokenSource>();
        private static IDictionary<string, DateTime> _keepAlives = new Dictionary<string, DateTime>();

        public ProgressHub(IConfiguration configuration)
        {
            this._configuration = configuration;
        }

        public async void GetLog(string id)
        {
            ShowLogTask slt = new ShowLogTask(id);
            initBackgroundTask(slt);
            await slt.DoStuff();
        }

        public async void PullImage(string fqin, string tag)
        {
            PullImageTask pit = new PullImageTask(fqin, tag);
            initBackgroundTask(pit);
            await pit.DoStuff();
        }

        private void initBackgroundTask(BackgroundTask bt)
        {
            CancellationTokenSource cancellation = new CancellationTokenSource();
            var myGuid = Guid.NewGuid().ToString();
            _keepAlives[myGuid] = DateTime.Now;
            _tokens.Add(myGuid, cancellation);
            bt.SetBasics(Clients, _configuration, myGuid, cancellation, Context.ConnectionId);
        }

        public void KeepAlive(string guid)
        {
            _keepAlives[guid] = DateTime.Now;
        }

        public static bool IsBroken(string guid)
        {
            return _keepAlives[guid].AddSeconds(10) < DateTime.Now;
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