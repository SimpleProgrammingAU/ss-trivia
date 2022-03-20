import React, { Component } from "react";
import GUN, { IGunChain, IGunInstance } from "gun";
import Container from "@mui/material/Container";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import DeleteIcon from "@mui/icons-material/Delete";
import DoneIcon from "@mui/icons-material/Done";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import { Team } from "../utils";
import styles from "../styles/Host.module.css";

/**
 * User interface for the trivia host to interact with
 */
class Host extends Component<Record<string, never>, HostState> {
  /** Database instance */
  private _db: IGunInstance;
  /** Answer list database node */
  private _answers: IGunChain<any, IGunInstance<any>, IGunInstance<any>, "test">;
  /** Local answer list */
  private _answerList: Answer[];
  /** Flag to prevent the answer changing in the UI */
  private _holdAnswer: boolean;

  constructor(props: Record<string, never>) {
    super(props);
    this._db = GUN({ peers: ["http://localhost:8765/gun"], radisk: false });
    this._answers = this._db.get("test");
    this._answerList = [];
    this._holdAnswer = false;
    this.state = {
      nextAnswer: null,
      showAuthor: 0,
      mmScore: 0,
      rtsoScore: 0,
      sseScore: 0,
      sswScore: 0,
    };
  }

  componentDidMount = () => {
    // Listen for updates on the "test" node
    this._answers.map().on(this._handleUpdate);
  };

  /**
   * Processes incoming database updates
   * @param data - raw data received from Gun
   * @param idx - item index in Gun database
   */
  private _handleUpdate = (data: RawAnswer | null, idx: string) => {
    delete data?._;
    // the next answer should either be null or the first entry in the answerList table
    const nextAnswer: Answer | null =
      this._answerList.length === 0 ? (data === null ? data : { ...data, idx }) : this._answerList[0];
    if (data === null) {
      //filters out deleted items from local answer list
      this._answerList = [...this._answerList.filter((ans) => ans.idx !== idx)];
    } else {
      //adds the new item to the answer list
      this._answerList.push({ ...data, idx });
    }
    //Updates the UI if available
    if (!this._holdAnswer) this.setState({ nextAnswer });
  };

  /**
   * Handles click events when the displayed answer is marked correct
   */
  private _markCorrect = () => {
    const { nextAnswer } = this.state;
    //Only performs action if there is an answer to mark
    if (nextAnswer) {
      this._holdAnswer = true; //holds the answer on screen
      this.setState({ showAuthor: 1 }); //displays the answer's author and teamname
      this._changeScore(nextAnswer.team, 1); //adds one to the score of the relevant team
      this._clearAnswerList(); //clears the answer list as the correct answer has been found
      setTimeout(() => {
        this._holdAnswer = false; //clears the hold
        this.setState({ showAuthor: 0 }); //hides the author again
      }, 5000);
    }
  };

  /**
   * Handles click events when the displayed answer is marked incorrect
   */
  private _markIncorrect = () => {
    const { nextAnswer } = this.state;
    // Clears the database entry for the incorrect answer
    // this should cause an update event to trigger _handleUpdate and put in the next answer, if available
    if (nextAnswer) this._answers.get(nextAnswer.idx).put(null);
  };

  /**
   * Resets the answer list and nulls all entries in the database
   */
  private _clearAnswerList = () => {
    for (const ans of this._answerList) {
      this._answers.get(ans.idx).put(null);
    }
    this._answerList = [];
  };

  /**
   * Adjusts the input team's score by the value entered (negative values reduce the score)
   * @param team - the team who's score is being changed
   * @param value - the change to the teams score
   */
  private _changeScore = (team: Team, value: number) => {
    const { mmScore, rtsoScore, sseScore, sswScore } = this.state;
    switch (team) {
      case "MM":
        this.setState({ mmScore: mmScore + value });
        break;
      case "RTSO":
        this.setState({ rtsoScore: rtsoScore + value });
        break;
      case "SSE":
        this.setState({ sseScore: sseScore + value });
        break;
      case "SSW":
        this.setState({ sswScore: sswScore + value });
        break;
    }
  };

  render = () => {
    const { nextAnswer, showAuthor, mmScore, rtsoScore, sseScore, sswScore } = this.state;
    return (
      <Container maxWidth="md" className={styles.Host}>
        <Paper elevation={3} className={styles.answerPaper}>
          <span className={styles.answerLabel}>Current answer:</span>
          <p className={styles.answerText}>{nextAnswer === null ? "Waiting for answers" : nextAnswer.answer}</p>
          <div className={styles.buttonContainer}>
            <IconButton aria-label="Correct" onClick={this._markCorrect}>
              <DoneIcon color="success" />
            </IconButton>
            <IconButton aria-label="Incorrect" onClick={this._markIncorrect}>
              <DeleteIcon color="error" />
            </IconButton>
          </div>
          <span className={styles.answerLabel} style={{ opacity: showAuthor }}>
            Answered by: {nextAnswer !== null ? `${nextAnswer.name} - ${nextAnswer.team}` : null}
          </span>
        </Paper>
        <Paper elevation={3} className={styles.leadersPaper}>
          <TableContainer component={Paper}>
            <Table aria-label="Scorboard">
              <TableHead>
                <TableRow>
                  <TableCell>Team</TableCell>
                  <TableCell align="right">Score</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>Managed Motorways</TableCell>
                  <TableCell align="right">{mmScore}</TableCell>
                  <TableCell className={styles.cellButtons}>
                    <IconButton aria-label="Add to score" onClick={() => this._changeScore(Team.ManagedMotorways, 1)}>
                      <AddIcon color="success" />
                    </IconButton>
                    <IconButton aria-label="Subtract from score" onClick={() => this._changeScore(Team.ManagedMotorways, -1)}>
                      <RemoveIcon color="error" />
                    </IconButton>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Real-time Signal Operations</TableCell>
                  <TableCell align="right">{rtsoScore}</TableCell>
                  <TableCell className={styles.cellButtons}>
                    <IconButton aria-label="Add to score" onClick={() => this._changeScore(Team.RealTime, 1)}>
                      <AddIcon color="success" />
                    </IconButton>
                    <IconButton aria-label="Subtract from score" onClick={() => this._changeScore(Team.RealTime, -1)}>
                      <RemoveIcon color="error" />
                    </IconButton>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Signal Services East</TableCell>
                  <TableCell align="right">{sseScore}</TableCell>
                  <TableCell className={styles.cellButtons}>
                    <IconButton aria-label="Add to score" onClick={() => this._changeScore(Team.SignalServicesEast, 1)}>
                      <AddIcon color="success" />
                    </IconButton>
                    <IconButton aria-label="Subtract from score" onClick={() => this._changeScore(Team.SignalServicesWest, -1)}>
                      <RemoveIcon color="error" />
                    </IconButton>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Signal Services West</TableCell>
                  <TableCell align="right">{sswScore}</TableCell>
                  <TableCell className={styles.cellButtons}>
                    <IconButton aria-label="Add to score" onClick={() => this._changeScore(Team.SignalServicesWest, 1)}>
                      <AddIcon color="success" />
                    </IconButton>
                    <IconButton aria-label="Subtract from score" onClick={() => this._changeScore(Team.SignalServicesWest, -1)}>
                      <RemoveIcon color="error" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Container>
    );
  };
}

export { Host };

interface HostState {
  nextAnswer: Answer | null;
  showAuthor: 0 | 1;
  mmScore: number;
  rtsoScore: number;
  sseScore: number;
  sswScore: number;
}

interface BaseAnswer {
  name: string;
  team: Team;
  answer: string;
}

interface RawAnswer extends BaseAnswer {
  _: any;
}

interface Answer extends BaseAnswer {
  idx: string;
}
