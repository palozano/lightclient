// Cryptography crates
// use blst::min_pk::*;
use blst::min_pk::SecretKey;
use blst::BLST_ERROR;
use rand::{thread_rng, RngCore};

#[derive(Debug)]
pub struct Thing {
    pub value: f32,
    pub other: f32,
}

impl Thing {
    pub fn new(val: f32, oth: f32) -> Thing {
        Thing {
            value: val,
            other: oth,
        }
    }
}

pub fn minimal_example() {
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
