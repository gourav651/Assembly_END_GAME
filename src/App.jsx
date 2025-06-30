import { useEffect, useRef, useState } from "react";
import { languages } from "./language";
import { clsx } from "clsx";
import {
  getFarewellText,
  getRandomWord,
} from "../../../Chef_Claude/recipe_app/src/utils";
import Confetti from "react-confetti";
import winSoundFile from "./assets/sounds/win.mp3";
import loseSoundFile from "./assets/sounds/lost.mp3";

export default function AssemblyEndgame() {
  // State values
  const [timeLeft, setTimeLeft] = useState(60); // 60 seconds timer
  const [currentWord, setCurrentWord] = useState(getRandomWord());
  const [guessedLetters, setGuessedLetters] = useState([]);
  const [hasStarted, setHasStarted] = useState(false);

  const numGuessesLeft = languages.length - 1;
  // Derived values
  const wrongGuessCount = guessedLetters.filter(
    (letter) => !currentWord.includes(letter)
  ).length;

  const remainingGuesses = numGuessesLeft - wrongGuessCount;

  const isGameWon = currentWord
    .split("")
    .every((letter) => guessedLetters.includes(letter));
  const isGameLost = wrongGuessCount >= numGuessesLeft;
  const isGameOver = isGameWon || isGameLost;
  const lastGuessedLetter = guessedLetters[guessedLetters.length - 1];
  const isLastGuessIncorrect =
    lastGuessedLetter && !currentWord.includes(lastGuessedLetter);
  const winSoundRef = useRef(null);

  useEffect(() => {
    if (isGameOver) return; // Don't continue timer after win/loss
    if (timeLeft <= 0) {
      setGuessedLetters([...currentWord]); // Force a loss
      return;
    }
    const timer = setTimeout(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, isGameOver]);

  useEffect(() => {
    if (isGameWon && winSoundRef.current) {
      winSoundRef.current.play();
    }
  }, [isGameWon]);
  const loseSoundRef = useRef(null);

  useEffect(() => {
    if (isGameLost && loseSoundRef.current) {
      loseSoundRef.current.play();
    }
  }, [isGameLost]);

  // Static values
  const alphabet = "abcdefghijklmnopqrstuvwxyz";

  function addGuessedLetter(letter) {
    setGuessedLetters((prevLetters) =>
      prevLetters.includes(letter) ? prevLetters : [...prevLetters, letter]
    );
  }

  function startNewGame() {
    setCurrentWord(getRandomWord());
    setGuessedLetters([]);
    setTimeLeft(60);
    setHasStarted(true);
  }

  const languageElements = languages.map((lang, index) => {
    const isLanguageLost = index < wrongGuessCount;
    const styles = {
      backgroundColor: lang.backgroundColor,
      color: lang.color,
    };
    const className = clsx("chip", isLanguageLost && "lost");
    return (
      <span className={className} style={styles} key={lang.name}>
        {lang.name}
      </span>
    );
  });

  const letterElements = currentWord.split("").map((letter, index) => {
    const shouldRevealLetter = isGameLost || guessedLetters.includes(letter);
    const letterClassname = clsx(
      isGameLost && !guessedLetters.includes(letter) && "missed-letter"
    );
    return (
      <span key={index} className={letterClassname}>
        {shouldRevealLetter ? letter.toUpperCase() : ""}
      </span>
    );
  });

  const keyboardElements = alphabet.split("").map((letter) => {
    const isGuessed = guessedLetters.includes(letter);
    const isCorrect = isGuessed && currentWord.includes(letter);
    const isWrong = isGuessed && !currentWord.includes(letter);
    const className = clsx({
      correct: isCorrect,
      wrong: isWrong,
    });

    return (
      <button
        className={className}
        key={letter}
        disabled={isGameOver}
        aria-disabled={guessedLetters.includes(letter)}
        aria-label={`Letter ${letter}`}
        onClick={() => addGuessedLetter(letter)}
      >
        {letter.toUpperCase()}
      </button>
    );
  });

  const gameStatusClass = clsx("game-status", {
    won: isGameWon,
    lost: isGameLost,
    farewell: !isGameOver && isLastGuessIncorrect,
  });

  function renderGameStatus() {
    if (!isGameOver && isLastGuessIncorrect) {
      return (
        <p className="farewell-message">
          {getFarewellText(languages[wrongGuessCount - 1].name)}
        </p>
        //
      );
    }
    if (isGameWon) {
      return (
        <>
          <h2>You win!</h2>
          <p>Well done! 🎉</p>
        </>
      );
    }
    if (isGameLost) {
      return (
        <>
          <h2>Game over!</h2>
          <p>You lose! Better start learning Assembly 😭</p>
        </>
      );
    }
    return null;
  }

  return (
    <main>
      <audio ref={winSoundRef} src={winSoundFile} preload="auto" />
      <audio ref={loseSoundRef} src={loseSoundFile} preload="auto" />

      {!hasStarted ? (
        <div className="start-screen">
          <h1>Assembly: Endgame</h1>
          <p>
            Guess the programming-related word within 8 attempts or before the
            timer runs out! Each wrong guess destroys a language. Save them all
            from Assembly!
          </p>
        </div>
      ) : (
        <>
          {isGameWon && <Confetti recycle={false} numberOfPieces={5000} />}

          <header>
            <h1>Assembly: Endgame</h1>
            <p>
              Guess the word within 8 attempts to keep the programming world
              safe from Assembly!
            </p>
          </header>

          <p className="timer">⏰ Time Left: {timeLeft} sec</p>

          <p
            className={clsx("remaining-guesses", {
              low: remainingGuesses <= 2,
              medium: remainingGuesses <= 4 && remainingGuesses > 2,
              high: remainingGuesses > 4,
            })}
          >
            Remaining Guesses: {remainingGuesses}
          </p>

          <section aria-live="polite" role="status" className={gameStatusClass}>
            {renderGameStatus()}
          </section>

          <section className="language-chips">{languageElements}</section>

          <section className="word">{letterElements}</section>

          <section aria-live="polite" role="status" className="sr-only">
            <p>
              {currentWord.includes(lastGuessedLetter)
                ? `Correct! The letter ${lastGuessedLetter} is in the word.`
                : `Sorry, the letter ${lastGuessedLetter} is not in the word.`}
            </p>
            <p>
              Current Word:{" "}
              {currentWord
                .split("")
                .map((letter) =>
                  guessedLetters.includes(letter) ? letter + "." : "blank."
                )
                .join("")}
            </p>
          </section>

          <section className="keyboard">{keyboardElements}</section>
        </>
      )}

      {(!hasStarted || isGameOver) && (
        <button className="new-game" onClick={startNewGame}>
          {hasStarted ? "New Game" : "Start Game"}
        </button>
      )}
    </main>
  );
}
