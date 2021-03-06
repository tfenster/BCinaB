﻿using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using api.Models;
using api.Services;
using Microsoft.AspNetCore;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace api
{
    public class Program
    {
        public static void Main(string[] args)
        {
            if (!Directory.Exists("c:\\programdata\\bcinab"))
                Console.WriteLine("BCinaB works only with a folder c:\\programdata\\bcinab added as volume");
            CreateWebHostBuilder(args).Build().Run();
        }

        public static IWebHostBuilder CreateWebHostBuilder(string[] args) =>
            WebHost.CreateDefaultBuilder(args)
            .ConfigureServices(servicesCollection =>
            {
                servicesCollection
                    .AddSingleton<IEngineMonitorService, EngineMonitorService>()
                    .AddSingleton<IProtectorService<RegistryCredentials>, ProtectorService<RegistryCredentials>>();
            })
            .UseStartup<Startup>();
    }
}
