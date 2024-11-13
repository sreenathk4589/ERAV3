#!/bin/bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
source venv/bin/activate  # On Windows, use: .\venv\Scripts\activate

# Install requirements
pip install -r requirements.txt 