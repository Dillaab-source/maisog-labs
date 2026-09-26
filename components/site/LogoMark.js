export default function LogoMark({ motion }) {
  const still = motion === "still";

  return (
    <div className="logo-mark" aria-hidden="true" data-still={still ? "true" : "false"}>
      <img className="logo-mark-poster" src="/v10/assets/logo-mark-poster.png" alt="" width="960" height="960" />
      {!still ? (
        <>
          <video className="logo-mark-video logo-mark-video-a" src="/v10/assets/logo-mark.mp4" poster="/v10/assets/logo-mark-poster.png" muted autoPlay loop playsInline preload="metadata" />
          <video className="logo-mark-video logo-mark-video-b" src="/v10/assets/logo-mark.mp4" poster="/v10/assets/logo-mark-poster.png" muted autoPlay loop playsInline preload="metadata" />
        </>
      ) : null}
    </div>
  );
}
