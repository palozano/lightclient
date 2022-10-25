use crate::validation::verifs::Verification;

mod validation;

fn main() {
    let a = Verification {
        name: Some("p".to_string()),
        project: Some("n".to_string()),
    };
    println!("{:?}", a);
}
