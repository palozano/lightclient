// use crate::validation::verifs::Verification;
// mod validation;
mod verification;

// use blst::min_pk::*;
use blst::min_pk::SecretKey;
use blst::BLST_ERROR;
use rand::{thread_rng, RngCore};

fn main() {
    // let a = Verification {
    //     name: Some("p".to_string()),
    //     project: Some("n".to_string()),
    // };
    //
    // println!("{:?}", a);
    // let a = verification::Thing::new(10f32, 10f32);
    // println!("{:?}", a);

    let mut rng = thread_rng();
    let mut ikm = [0u8; 32];
    rng.fill_bytes(&mut ikm);

    let sk = SecretKey::key_gen(&ikm, &[]).unwrap();
    let pk = sk.sk_to_pk();

    let dst = b"BLS_SIG_BLS12381G2_XMD:SHA-256_SSWU_RO_NUL_";
    let msg = b"blst is such a blast";
    let sig = sk.sign(msg, dst, &[]);

    let err = sig.verify(false, msg, dst, &[], &pk, false);
    println!("{:?}", err);
    assert_eq!(err, BLST_ERROR::BLST_SUCCESS);
}
