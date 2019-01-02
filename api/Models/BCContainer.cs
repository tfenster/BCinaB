namespace api.Models {
    public class BCContainer {
        public string Registry {get; set;}
        public string Repository {get; set;}
        public string Image {get; set;}
        public string Tag {get; set;}
        public string ID {get; set;}
        public bool AcceptEula {get; set;}
        public bool BreakOnError {get; set;}
    }
}