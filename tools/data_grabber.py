#! /usr/bin/env python

import time
import csv
import subprocess
import json
import pyrebase
from datetime import datetime, timezone, timedelta
from pprint import pprint

unit_map = {
    "Statistics of Contributors that Moved": "moved",
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

firebase_config = {
    'apiKey': "AIzaSyAkHMLIBu1BMxSSrv7jX_6wnbg2WnujlCg",
    'authDomain': "march-madness-indexing.firebaseapp.com",
    'databaseURL': "https://march-madness-indexing.firebaseio.com",
    'storageBucket': "march-madness-indexing.appspot.com",
    'messagingSenderId': "554642006729",
    'serviceAccount': "firebase-service-account-auth.json"
}

def download_file():
    subprocess.run(["casperjs", "download_file.js"])

def process_file():
    with open("data.csv", newline='') as csv_file:
        reader = csv.DictReader(csv_file)

        data = {
            'timestamp': get_arizona_timestamp(),
            'units': {}
        } 
        for record in reader:
            new_record = {
                'arbitrated': int(record['Arbitrated']),
                'indexed': int(record['Indexed']),
                'unit_name': record['Name'],
                'redo_batches': int(record['Redo Batches']),
            }

            unit_name = new_record['unit_name']
            if unit_name in unit_map:
                ward_key = unit_map[unit_name]
                data['units'][ward_key] = new_record

        #pprint(data)
        return data

def process_contributor_file():
    with open("contributor_statistics.csv", newline='') as csv_file:
        # NOTE: Consume the first line. There appears to be a bug in the
        # website this data comes from. The first field name is blank, so we
        # need to ignore the first line and specify the field names manually.
        first_line = csv_file.readline()

        field_names = [
            'ward_name',
            'name',
            'indexed',
            'arbitrated',
            'redo_batches',
        ];
        reader = csv.DictReader(csv_file, fieldnames=field_names)

        data = {
            'timestamp': get_arizona_timestamp(),
            'wards': {}
        } 
        for record in reader:
            new_record = {
                'ward_name': record['ward_name'],
                'name': record['name'],
                'indexed': int(record['indexed']),
                'arbitrated': int(record['arbitrated']),
                'redo_batches': int(record['redo_batches']),
            }

            #for ward_name in unit_map:
            #    if ward_name == record['ward_name']:
            #        data[unit_map[ward_name]] = new_record

            ward_name = new_record['ward_name']
            if ward_name in unit_map:
                ward_key = unit_map[ward_name]
                data['wards'].setdefault(ward_key, []).append(new_record)

        #pprint(data)
        return data

def update_database(data):

    firebase = pyrebase.initialize_app(firebase_config)

    db = firebase.database()

    db.child("stake_and_ward_indexing").push(data)

def update_database_contributors(data):
    firebase = pyrebase.initialize_app(firebase_config)

    db = firebase.database()

    db.child("contributors").push(data)


def print_changes(prev_data, data):
    print("Data Change")
    print(get_arizona_timestamp())
    for key in prev_data['units']:
        if key in data['units']:
            if prev_data['units'][key] != data['units'][key]:
                print("<<<<<<<<<<<<<<<<<<<<")
                pprint(prev_data['units'][key])
                print("====================")
                pprint(data['units'][key])
                print(">>>>>>>>>>>>>>>>>>>>")
        else:
            print('key "{}" removed in new data'.format(key))

def print_contributor_changes(prev_data, data):
    print("Data Change")
    print(get_arizona_timestamp())
    for ward in prev_data['wards']:
        for person in prev_data['wards'][ward]:
            if ward in data['wards']:
                for other in data['wards'][ward]:
                    if person['name'] == other['name'] and person != other:
                        print("<<<<<<<<<<<<<<<<<<<<")
                        pprint(person)
                        print("====================")
                        pprint(other)
                        print(">>>>>>>>>>>>>>>>>>>>")
            else:
                print('ward "{}" removed in new data'.format(ward))

def get_arizona_timestamp():
    return datetime.now(timezone(-timedelta(hours=7))).isoformat()


if __name__ == '__main__':
    period_seconds = 10*60 # 10 minutes

    with open("data.json", "r") as prev_data_file:
        prev_data = json.load(prev_data_file)

    with open("contributor_statistics.json", "r") as prev_data_file:
        prev_data_contributors = json.load(prev_data_file)

    time_start = time.time()
    while True:
        download_file()
        data = process_file()
        contributor_data = process_contributor_file()

        if prev_data is not None and prev_data['units'] != data['units']:

            print_changes(prev_data, data)

            with open("data.json", "w") as out_file:
                json.dump(data, out_file, indent=2)
            update_database(data)

        prev_data = data


        if (prev_data_contributors is not None and
            prev_data_contributors['wards'] != contributor_data['wards']):

            print_contributor_changes(prev_data_contributors, contributor_data)

            with open("contributor_statistics.json", "w") as out_file:
                json.dump(contributor_data, out_file, indent=2)
            update_database_contributors(contributor_data)

        prev_data_contributors = contributor_data 


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
