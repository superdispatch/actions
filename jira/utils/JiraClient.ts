import JiraApi from 'jira-client';

interface Transition {
  id: string;
  name: string;
}

interface RemoteLinkResponse {
  object: {
    title: string;
    url: string;
  };
}

interface RemoteLink {
  object: {
    title: string;
    url: string;
  };
}

export class JiraClient extends JiraApi {
  listTransitions(issueId: string) {
    return super.listTransitions(issueId) as Promise<{
      transitions: Transition[];
    }>;
  }

  transitionIssue(
    issueId: string,
    issueTransition: {
      transition: { id: string };
    },
  ): Promise<JiraApi.JsonResponse> {
    return super.transitionIssue(issueId, issueTransition);
  }

  getRemoteLinks(issueNumber: string) {
    return super.getRemoteLinks(issueNumber) as Promise<RemoteLinkResponse[]>;
  }

  createRemoteLink(issueNumber: string, remoteLink: RemoteLink) {
    return super.createRemoteLink(
      issueNumber,
      remoteLink,
    ) as Promise<RemoteLink>;
  }
}
