export function existingApplicationMessage(status?: string): string {
  switch (status) {
    case "Pending":
      return "Your application is awaiting review. You do not need to upload your documents again. To change your submission, contact us using your application email.";
    case "Accepted":
      return "Your creator application has been accepted. Open your dashboard to continue.";
    case "Need Proof":
      return "Your application needs additional proof. Contact us using your application email to arrange the requested documents.";
    case "Rejected":
      return "Your application was not approved. Contact us using your application email to discuss the review or next steps.";
    default:
      return "An application for this email is already on file. This upload did not replace it. Sign in with the application email to view its status, or contact us to update your documents.";
  }
}
