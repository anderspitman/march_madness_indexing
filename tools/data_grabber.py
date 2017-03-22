#! /usr/bin/env python

import time
import csv
import subprocess
import json
import pyrebase

unit_map = {
    "Tempe Arizona YSA Stake": "full_stake",
    "Horizon YSA Ward": "horizon",
    "McClintock YSA Ward": "mcclintock",
    "Mission Bay YSA Ward": "mission_bay",
    "San Marcos YSA Ward": "san_marcos",
    "South Mountain YSA Ward": "south_mountain",
    "Towne Lake YSA Ward": "towne_lake",
    "University YSA Ward": "university",
    "Southshore YSA Ward": "southshore",
    "Pioneer YSA Ward": "pioneer"
}

def download_file():
    subprocess.run(["casperjs", "download_file.js"])

def process_file():
    with open("data.csv", newline='') as csv_file:
        reader = csv.DictReader(csv_file)

        data = {} 
        for record in reader:
            new_record = {
                'Arbitrated': int(record['Arbitrated']),
                'Indexed': int(record['Indexed']),
                'Name': record['Name'],
                'Redo Batches': int(record['Redo Batches']),
            }

            for full_name in unit_map:
                if full_name == record['Name']:
                    data[unit_map[full_name]] = new_record
        print(data)
        return data

def update_database(data):
    config = {
        'apiKey': "AIzaSyAkHMLIBu1BMxSSrv7jX_6wnbg2WnujlCg",
        'authDomain': "march-madness-indexing.firebaseapp.com",
        'databaseURL': "https://march-madness-indexing.firebaseio.com",
        'storageBucket': "march-madness-indexing.appspot.com",
        'messagingSenderId': "554642006729",
        'serviceAccount': "firebase-service-account-auth.json"
    }

    firebase = pyrebase.initialize_app(config)

    db = firebase.database()

    db.child("indexing").push(data)


def print_changes(prev_data, data):
    print("Data Change")
    for key in prev_data:
        if prev_data[key] != data[key]:
            print("  {} ===> {}".format(prev_data[key], data[key]))

if __name__ == '__main__':
    period_seconds = 10*60 # 10 minutes

    with open("data.json", "r") as prev_data_file:
        prev_data = json.load(prev_data_file)

    time_start = time.time()
    while True:
        download_file()
        data = process_file()

        if prev_data is not None and prev_data != data:

            print_changes(prev_data, data)

            with open("data.json", "w") as out_file:
                json.dump(data, out_file, indent=2)
            update_database(data)

        prev_data = data

        curr_time = time.time()
        elapsed = curr_time - time_start
        print("elapsed: {}".format(elapsed))

        sleep_for = period_seconds - elapsed

        if sleep_for > 0:
            print("sleep for: {}".format(sleep_for))
            time.sleep(sleep_for)
        else:
            print("Not sleeping")
        time_start = time.time()
