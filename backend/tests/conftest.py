import os

# Tests assert the curated golden figures, so they must never reach the warehouse.
os.environ["DATA_BACKEND"] = "golden"
