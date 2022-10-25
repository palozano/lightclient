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
