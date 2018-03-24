#! /usr/bin/env python3

import os
import sys
import csv
import time
import subprocess
import json

from datetime import datetime
from pprint import pprint

def download_file():
    subprocess.run(["casperjs", "download_file.js"])

def is_header_row(row):
    return row[0] == 'Group UUID'

def is_contributor_row(row):
    return len(row) == 17

def is_group_row(row):
    return len(row) == 9

def parse_contributor_row(row):

    indexed_index = 3

    indexed = 0
    if len(row[indexed_index]) > 0:
        indexed = int(float(row[indexed_index]))

    return {
        'group_uuid': row[0],
        'display_name': row[2],
        'indexed': indexed,
        'group_short_name': row[7],
        'member_uuid': row[9],
    }

def parse_group_row(row):

    indexed_index = 2

    indexed = 0
    if len(row[indexed_index]) > 0:
        indexed = int(float(row[indexed_index]))

    return {
        'group_uuid': row[0],
        'indexed': indexed,
        'group_short_name': row[5],
    }

def process_file(out_dir):
    with open("data.csv", newline='') as csv_file:
        ##reader = csv.DictReader(csv_file)
        reader = csv.reader(csv_file)

        contributor_records = []
        group_records = []

        group_table = {}

        for row in reader:

            if is_header_row(row):
                continue

            if is_contributor_row(row):
                contributor_records.append(parse_contributor_row(row))
            elif is_group_row(row):
                record = parse_group_row(row)
                group_records.append(record)

                group_uuid = record['group_uuid']
                if group_uuid not in group_table:
                    group_table[group_uuid] = record
                else:
                    group_table[group_uuid]['indexed'] += record['indexed']

            else:
                pass
                #raise Exception("Invalid row")

        #pprint(contributor_records)
        pprint(group_table)

    timestamp = datetime.utcnow().isoformat()

    group_data = {
        'timestamp_utc': timestamp,
        'table': group_table
    }

    contributor_data = {
        'timestamp_utc': timestamp,
        'records': contributor_records
    }

    path = os.path.join(
            out_dir, 'database', 'group_data',
            "group_data_" + timestamp + ".json")

    with open(path, 'w') as json_file:
        json.dump(group_data, json_file, indent=2)

    path = os.path.join(
            out_dir, 'database', 'contributor_data',
            "contributor_data_" + timestamp + ".json")

    with open(path, 'w') as json_file:
        json.dump(contributor_data, json_file, indent=2)


if __name__ == '__main__':

    if len(sys.argv) != 2:
        print("Invalid args")
        sys.exit(1)

    out_dir = sys.argv[1]

    #period_seconds = 10*60 # 10 minutes
    period_seconds = 20

    time_start = time.time()
    while True:
        download_file()
        process_file(out_dir)

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
