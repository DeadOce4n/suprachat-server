#!/usr/bin/python3

import os, sys, json
import logging
from dotenv import load_dotenv
from pymongo import MongoClient
from werkzeug.security import check_password_hash

load_dotenv()

logging.basicConfig(
    filename='/ircd/db/auth.log',
    level=os.getenv('AUTH_LOG_LEVEL') or 'INFO'
)


def main():
    try:
        raw_input = sys.stdin.readline()
        ergo_user = json.loads(raw_input)
        account_name = ergo_user.get("accountName")
        passphrase = ergo_user.get("passphrase")

        logging.info(f"Account: {account_name} | Attempting login...")

        if account_name is None or passphrase is None:
            logging.error(f"Account: {account_name} | User or password missing.")
            print(json.dumps({"success": False, "error": "User or password missing."}))
            sys.exit(1)

        client = MongoClient(os.getenv("MONGO_URI"))
        users = client["suprachat-dev"].users

        api_user = users.find_one({"nick": account_name})

        if api_user is None:
            logging.error(f"Account: {account_name} | User not found in database.")
            print(
                json.dumps({"success": False, "error": f"User {account_name} not found."})
            )
            sys.exit(1)

        elif api_user and check_password_hash(api_user["password"], passphrase):
            logging.info(f"Account: {account_name} | Successfull login!")
            print(
                json.dumps({"success": True, "message": "User found and passwords match."})
            )
        else:
            logging.error(f"Account: {account_name} | Wrong password!")
            print(
                json.dumps(
                    {
                        "success": False,
                        "error": f"User {account_name} found but passwords don't match.",
                    }
                )
            )
    except Exception as e:
        logging.error(e)
        sys.exit(1)


if __name__ == "__main__":
    main()
