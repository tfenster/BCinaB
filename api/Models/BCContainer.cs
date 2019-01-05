using System.Collections.Generic;

namespace api.Models
{
    public class BCContainer
    {
        public string Registry { get; set; }
        public string Repository { get; set; }
        public string Image { get; set; }
        public string Tag { get; set; }
        public string ID { get; set; }
        public string Name { get; set; }
        public IList<string> Env { get; set; }
        public string GuiDef { get; set; }
    }
}