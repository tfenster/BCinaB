using Docker.DotNet.Models;

namespace api.Models
{
    public class SystemInfo
    {
        public SystemInfoResponse SystemInfoResponse { get; set; }
        public VersionResponse VersionResponse { get; set; }
    }
}