using System;
using System.IO;
using Microsoft.AspNetCore.DataProtection;
using Newtonsoft.Json;

namespace api.Services
{
    public interface IProtectorService<T>
    {
        void ProtectAndStore(string key, T t);
        T Get(string key);
    }

    public class ProtectorService<T> : IProtectorService<T> where T : class
    {
        protected IDataProtector _protector;
        private const string _basePath = "c:\\programdata\\bcinab";

        public ProtectorService(IDataProtectionProvider provider)
        {
            this._protector = provider.CreateProtector("Protector.BCinaB.v1");
        }

        public void ProtectAndStore(string key, T t)
        {
            string serialized = JsonConvert.SerializeObject(t);
            string protectedSerialized = _protector.Protect(serialized);
            string basePath = GetBasePath();

            if (!Directory.Exists(basePath)) Directory.CreateDirectory(basePath);
            using (FileStream stream = System.IO.File.Open(GetFilePath(key), FileMode.OpenOrCreate, FileAccess.Write, FileShare.None))
            {
                using (StreamWriter writer = new StreamWriter(stream))
                {
                    stream.Position = 0;
                    writer.Write(protectedSerialized);
                    stream.SetLength(stream.Position);
                }
            }
        }

        public T Get(string key)
        {
            string basePath = GetBasePath();
            string filePath = GetFilePath(key);

            if (!Directory.Exists(basePath) || !File.Exists(GetFilePath(key))) return null;
            using (FileStream stream = System.IO.File.Open(GetFilePath(key), FileMode.Open, FileAccess.Read, FileShare.None))
            {
                using (StreamReader reader = new StreamReader(stream))
                {
                    var protectedSerialized = reader.ReadLine();
                    var serialized = _protector.Unprotect(protectedSerialized);
                    T t = JsonConvert.DeserializeObject<T>(serialized);
                    return t;
                }
            }


        }

        private string GetBasePath()
        {
            Type typeParameterType = typeof(T);
            return _basePath + Path.DirectorySeparatorChar + typeParameterType.Name;
        }

        private string GetFilePath(string key)
        {
            return GetBasePath() + Path.DirectorySeparatorChar + key + ".cred";
        }
    }

}