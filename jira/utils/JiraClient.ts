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

export interface JIRAIssue {
  id: string;
  self: string; // jira link
  key: string;
  fields: {
    project: {
      self: string;
      id: string;
      key: string;
      name: string;
      projectTypeKey: string;
      simplified: boolean;
    };
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

  getIssue(issueIdOrKey: string, fields?: string | string[], expand?: string) {
    return super.getIssue(issueIdOrKey, fields, expand) as Promise<JIRAIssue>;
  }
}
