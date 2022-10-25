// use crate::validation::verifs::Verification;
// mod validation;

mod verification;

fn main() {
    // let a = Verification {
    //     name: Some("p".to_string()),
    //     project: Some("n".to_string()),
    // };
    // println!("{:?}", a);

    let a = verification::Thing::new(10f32, 10f32);
    println!("{:?}", a);
}
