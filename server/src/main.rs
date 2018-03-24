#![feature(plugin)]
#![plugin(rocket_codegen)]

extern crate rocket;

use std::io;
use std::io::prelude::*;
use std::fs;
use std::fs::File;
use std::path::{Path, PathBuf};

use rocket::response::NamedFile;

fn get_sorted_filename_list(dir: &str) -> Vec<String> {

    let entries = fs::read_dir(dir).unwrap();

    let mut paths = Vec::new();

    for entry in entries {
        let entry = entry.unwrap();
        let path = entry.path();

        if path.is_file() {
            let path_str = path.into_os_string().into_string().unwrap();
            paths.push(path_str);
        }
    }

    paths.sort();

    return paths;
}

// server index.html
#[get("/")]
fn index() -> io::Result<NamedFile> {
    NamedFile::open(Path::new("../public/index.html"))
}

// server static files from ../public/ directory
#[get("/<file..>")]
fn files(file: PathBuf) -> Option<NamedFile> {
    NamedFile::open(Path::new("../public/").join(file)).ok()
}

// TODO: figure out how to make this return JSON so the content type is
// properly set
#[get("/latest_data")]
fn latest_data() -> String {

    let group_filenames = get_sorted_filename_list("database/group_data");

    let latest = group_filenames.last().unwrap();

    let mut file = File::open(latest).unwrap();
    let mut contents = String::new();
    file.read_to_string(&mut contents).unwrap();

    contents
}

fn rocket() -> rocket::Rocket {
    rocket::ignite().mount("/", routes![index, files, latest_data])
}

fn main() {
    rocket().launch();
}
