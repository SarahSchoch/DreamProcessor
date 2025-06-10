# DreamProcessor

**DreamProcessor** is a browser-based application for the review, cleaning, and anonymization of dream reports collected. It is designed to facilitate the processing of raw or automatically pre-cleaned dream reports (e.g., by using AI or NLP).
---

## Live Demo

Access the application via CodePen (does not work with Safari, please use Firefox or Chrome):  
[https://codepen.io/sarahschoch/full/qBeqdey](hhttps://codepen.io/sarahschoch/full/qBeqdey)

---

## Required File Format

The application accepts `.csv` and `.xlsx` files. At minimum, the dataset should contain:

- **Participant ID column**  
  Any column containing "id" in its name (e.g., `Participant.Id`).

- **Dream Report column(s)**  
  One or more fields containing dream narratives. The application automatically detects known formats with "report" in its name.

- **Date field**  
  A column indicating when the dream report was recorded or completed. The application automatically detects known formats with "date" in its name.

In addition to raw data, users may upload a previously exported and cleaned file, which will be matched by participant ID, source field, and completion date.

---

## Core Features

- Upload and parse `.csv` or `.xlsx` files
- Interface for reviewing and editing individual dream reports
- Change-tracking: view differences between original and cleaned reports
- Restore original report or confirm and keep the cleaned version
- Manual anonymization tools to replace:
  - Names with `[NAME#]`
  - Places with `[PLACE#]`
  - Experimenter references with `[EXPERIMENTER#]`
- Support for splitting a dream report into multiple entries (i.e., if participant put multiple dream reports together)
- Option to remove dream reports (e.g., if no content is reported)
- Export all processed dream reports to a structured `.csv`

---

## Output Format

The exported `.csv` includes the following columns:

| Column              | Description                                          |
|---------------------|------------------------------------------------------|
| `ID`                | Participant identifier                               |
| `DreamReport`       | Final cleaned and/or edited dream content            |
| `Source`            | Name of the original report field                    |
| `SurveyCompletedOn` | Report completion date (used to match original data) |
| `Status`            | `Processed` or `Not Processed`                       |

---

## Use as Post-AI Review Interface

DreamProcessor also functions as a second-stage manual review interface following automatic cleaning by AI or NLP models. When cleaned versions of dream reports are included in columns prefixed with `Cleaned_` (e.g., `Cleaned_Home_dream_recall_remark_1`), the application will:

- Load the cleaned version automatically if available  
- Display differences with the original report using visual highlights  
- Allow the user to keep, edit, or revert the cleaned content  
- Track review status for each report  

---

## Local Use

To use the application offline:

1. Clone or download this repository.
2. Open `index.html` in a browser (no installation required).
3. Upload a `.csv` or `.xlsx` file to begin processing.

---

## Technologies Used

- React (via CDN)
- XLSX (SheetJS)
- PapaParse
- Diff Match Patch (Google)

All logic runs in the browser; no server-side components are involved.

---

## License

This project is distributed under the MIT License. Free to use, modify, and redistribute with attribution.

---

## Acknowledgments

Developed by [Sarah Schoch](https://github.com/SarahSchoch).

This project was developed with assistance from **ChatGPT** and **Claude**.

