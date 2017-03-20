#! /usr/bin/env python

from datetime import datetime 
import time
import os
import csv
import subprocess


def download_file():
    subprocess.run(["casperjs", "download_file.js"])

def process_file():
    with open("data.csv", newline='') as csv_file:
        reader = csv.DictReader(csv_file)

        data = []
        for record in reader:
            data.append(record)
        print(data)
        return data

if __name__ == '__main__':
    os.environ["PATH"] += os.pathsep + os.getcwd()
    period_seconds = 60

    prev_data = None
    time_start = time.time()
    while True:
        download_file()
        data = process_file()

        if prev_data is not None:
            if data[0]['Indexed'] != prev_data[0]['Indexed']:
                print("New data")

        prev_data = data

        curr_time = time.time()
        elapsed = curr_time - time_start
        print("elapsed: {}".format(elapsed))

        sleep_for = period_seconds - elapsed
        print("sleep for: {}".format(sleep_for))
        time.sleep(sleep_for)
        time_start = time.time()
