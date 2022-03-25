import React, { Component, ChangeEvent } from "react";
import GUN, { GunMessagePut, IGunChain, IGunInstance } from "gun";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import TextField from "@mui/material/TextField";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import { Team } from "../utils";
import styles from "../styles/Player.module.css";

/**
 * User interface for the players to enter their answers
 */
class Player extends Component<Record<string, never>, PlayerState> {
  /** Database instance */
  private _db: IGunInstance;
  /** Answer list database node */
  private _answers: IGunChain<any, IGunInstance<any>, IGunInstance<any>, "test">;

  constructor(props: Record<string, never>) {
    super(props);
    this._db = GUN({ peers: ["http://localhost:8765/gun"], radisk: false });
    this._answers = this._db.get("test");
    this.state = { answer: "", mode: "init", name: "", team: "", teamList: ["MM", "RTSO", "SSE", "SSW"] };
  }

  private _updateAnswer = (e: ChangeEvent<HTMLInputElement>) => {
    this.setState({ answer: e.target.value });
    return;
  };

  private _updateName = (e: ChangeEvent<HTMLInputElement>) => {
    this.setState({ name: e.target.value });
    return;
  };

  private _updateTeam = (e: SelectChangeEvent<string>) => {
    this.setState({ team: e.target.value as Team });
    return;
  };

  /**
   * Handles form submit events
   * Sets the player name and team if in the init mode
   * Adds answer to database if in game mode
   */
  private _submit = () => {
    console.log("Submit button clicked.");
    const { answer, mode, name, team } = this.state;
    if (mode === "init" && name.trim().length > 0 && team.length > 0) {
      console.log("Name submitted. Game mode updated.");
      this.setState({ mode: "game" });
    }
    if (mode === "game" && answer.trim().length > 0) {
      console.log("Answer submitted - processing...");
      const ansNode = this._db.get(`${name}-${team}`).put({ answer, name, team }, (msg: GunMessagePut) => {
        if (typeof msg === "string") console.error("SUBMIT ERROR:", msg);
        else {
          console.log("Commencing set operation...");
          this._answers.set(ansNode, (msg: GunMessagePut) => {
            if (typeof msg === "string") {
              console.error("SUBMIT ERROR:", msg);
              this._submit();
            } else {
              console.log("Submit Success for SET operation");
              this.setState({ answer: "" });
            }
          });
        }
      });
    }
  };

  render = () => {
    const { answer, mode, team, name, teamList } = this.state;
    return (
      <Container maxWidth="sm">
        <Paper elevation={3} className={styles.paper}>
          <h1>Trivia Buzzer</h1>
        </Paper>
        <Paper elevation={3} className={styles.paper}>
          {mode === "init" ? (
            <>
              <FormControl fullWidth className={styles.formRow}>
                <TextField id="player-name" label="Name" variant="outlined" value={name} onChange={this._updateName} />
              </FormControl>
              <FormControl fullWidth className={styles.formRow}>
                <InputLabel id="player-team-label">Team</InputLabel>
                <Select labelId="player-team-label" id="player-team" value={team} label="Team" onChange={this._updateTeam}>
                  {teamList.length === 0 ? (
                    <MenuItem value={""}>Loading</MenuItem>
                  ) : (
                    teamList.map((t) => (
                      <MenuItem key={t} value={t}>
                        {t}
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
            </>
          ) : (
            <FormControl fullWidth className={styles.formRow}>
              <TextField id="answer" label="Answer" variant="outlined" value={answer} onChange={this._updateAnswer} />
            </FormControl>
          )}
          <FormControl fullWidth className={styles.formRow}>
            <Button variant="contained" onClick={this._submit}>
              Submit
            </Button>
          </FormControl>
        </Paper>
      </Container>
    );
  };
}

export { Player };

interface PlayerState {
  answer: string;
  mode: "init" | "game";
  name: string;
  team: Team | "";
  teamList: string[];
}
